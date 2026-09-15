import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { buildWhatsAppLink, buildWhatsAppMessage } from '../lib/whatsapp-utils';
import BookingList from './components/BookingList';
import BookingDetail from './components/BookingDetail';

interface Booking {
  id: string;
  guest_name: string;
  phone: string;
  email: string | null;
  guests: number;
  check_in: string;
  check_out: string;
  room_type: string;
  special_requests: string | null;
  status: string;
  owner_notified: boolean;
  confirmation_sent: boolean;
  created_at: string;
}

const ADMIN_PASSWORD = 'lacoastal2026';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem('lac_admin_auth');
    if (saved === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('lac_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('lac_admin_auth');
    setPassword('');
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBookings();
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, fetchBookings]);

  const sendOwnerEmail = async (booking: Booking) => {
    try {
      const res = await fetch('/api/send-owner-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking }),
      });
      if (!res.ok) throw new Error('Failed');
      await supabase.from('bookings').update({ owner_notified: true }).eq('id', booking.id);
      setEmailErrors(prev => { const n = { ...prev }; delete n[booking.id]; return n; });
    } catch {
      setEmailErrors(prev => ({ ...prev, [booking.id]: 'Owner email failed' }));
    }
  };

  const sendGuestEmail = async (booking: Booking, type: 'confirmed' | 'declined') => {
    if (!booking.email) return;
    try {
      const res = await fetch('/api/send-guest-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking, type }),
      });
      if (!res.ok) throw new Error('Failed');
      await supabase.from('bookings').update({ confirmation_sent: true }).eq('id', booking.id);
    } catch {
      setEmailErrors(prev => ({ ...prev, [booking.id]: 'Guest email failed' }));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from('bookings').update({ status }).eq('id', id);
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      if (status === 'confirmed') await sendGuestEmail(booking, 'confirmed');
      if (status === 'cancelled') await sendGuestEmail(booking, 'declined');
    }
    setUpdating(null);
    fetchBookings();
  };

  const filteredBookings = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b =>
      b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm) ||
      (b.email && b.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    thisMonth: bookings.filter(b => {
      const d = new Date(b.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1C1917] rounded-full mb-5">
              <svg className="w-6 h-6 text-[#FAFAF7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-medium text-[#1C1917] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>La Coastal</h1>
            <p className="text-sm text-[#78716C] mt-2 font-light">Admin Access</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white border border-[#E8E5DE] rounded-lg p-8 shadow-sm">
            <label className="block text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
              className="w-full px-4 py-3 border border-[#E8E5DE] rounded-md bg-[#FAFAF7] focus:outline-none focus:border-[#1C1917] transition-colors text-[#1C1917] placeholder-[#A8A29E]" autoFocus />
            {loginError && <p className="text-[#DC2626] text-sm mt-3">{loginError}</p>}
            <button type="submit" className="w-full mt-6 bg-[#1C1917] text-[#FAFAF7] py-3 rounded-md text-sm font-medium hover:bg-[#292524] transition-colors">Sign In</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="bg-white border-b border-[#E8E5DE] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1C1917] rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#FAFAF7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-medium text-[#1C1917]">La Coastal Admin</h1>
              <p className="text-xs text-[#78716C]">Booking Management</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-[#78716C] hover:text-[#1C1917] border border-[#E8E5DE] rounded-md hover:border-[#1C1917] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Confirmed', value: stats.confirmed },
            { label: 'This Month', value: stats.thisMonth },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-[#E8E5DE] rounded-lg p-5">
              <p className="text-xs text-[#78716C] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-medium text-[#1C1917]" style={{ fontFamily: "'Playfair Display', serif" }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-[#E8E5DE] rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search bookings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E8E5DE] rounded-md text-sm focus:outline-none focus:border-[#1C1917] bg-[#FAFAF7]" />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${filter === f ? 'bg-[#1C1917] text-[#FAFAF7]' : 'bg-[#FAFAF7] text-[#78716C] hover:bg-[#F5F5F0]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <BookingList
          bookings={filteredBookings}
          loading={loading}
          updating={updating}
          emailErrors={emailErrors}
          searchTerm={searchTerm}
          filter={filter}
          onUpdateStatus={updateStatus}
          onSelectBooking={setSelectedBooking}
          onNotifyOwner={(b: Booking) => { setUpdating(b.id); sendOwnerEmail(b).then(() => setUpdating(null)); }}
          buildWhatsAppLink={buildWhatsAppLink}
          buildWhatsAppMessage={buildWhatsAppMessage}
        />
      </main>

      <AnimatePresence>
        {selectedBooking && (
          <BookingDetail
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            buildWhatsAppLink={buildWhatsAppLink}
            buildWhatsAppMessage={buildWhatsAppMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
