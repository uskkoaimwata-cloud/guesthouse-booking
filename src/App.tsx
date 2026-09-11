import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

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

    if (!error && data) {
      setBookings(data as Booking[]);
    }
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const updates: Record<string, unknown> = { status };
    if (status === 'confirmed') updates.confirmation_sent = true;
    
    await supabase.from('bookings').update(updates).eq('id', id);
    setUpdating(null);
  };

  const markOwnerNotified = async (id: string) => {
    setUpdating(id);
    await supabase.from('bookings').update({ owner_notified: true }).eq('id', id);
    setUpdating(null);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1C1917] rounded-full mb-5">
              <svg className="w-6 h-6 text-[#FAFAF7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-medium text-[#1C1917] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              La Coastal
            </h1>
            <p className="text-sm text-[#78716C] mt-2 font-light">Admin Access</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-[#E8E5DE] rounded-lg p-8 shadow-sm">
            <label className="block text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-[#E8E5DE] rounded-md bg-[#FAFAF7] focus:outline-none focus:border-[#1C1917] transition-colors text-[#1C1917] placeholder-[#A8A29E]"
              autoFocus
            />
            {loginError && (
              <p className="text-[#DC2626] text-sm mt-3">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full mt-6 bg-[#1C1917] text-[#FAFAF7] py-3 rounded-md text-sm font-medium hover:bg-[#292524] transition-colors"
            >
              Sign In
            </button>
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#78716C] hover:text-[#1C1917] border border-[#E8E5DE] rounded-md hover:border-[#1C1917] transition-colors"
          >
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
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-[#E8E5DE] rounded-lg p-5"
            >
              <p className="text-xs text-[#78716C] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-medium text-[#1C1917]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-[#E8E5DE] rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E8E5DE] rounded-md text-sm focus:outline-none focus:border-[#1C1917] bg-[#FAFAF7]"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'bg-[#1C1917] text-[#FAFAF7]'
                    : 'bg-[#FAFAF7] text-[#78716C] hover:bg-[#F5F5F0]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && bookings.length === 0 ? (
          <div className="bg-white border border-[#E8E5DE] rounded-lg p-16 text-center">
            <div className="w-8 h-8 border-2 border-[#E8E5DE] border-t-[#1C1917] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#78716C] text-sm">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-[#E8E5DE] rounded-lg p-16 text-center">
            <svg className="w-12 h-12 text-[#D6D3D1] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-[#1C1917] font-medium mb-1">No bookings found</h3>
            <p className="text-[#78716C] text-sm">
              {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Bookings will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white border border-[#E8E5DE] rounded-lg hover:border-[#A8A29E] transition-colors"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-[#1C1917]">{booking.guest_name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-[#D1FAE5] text-[#065F46]'
                            : booking.status === 'pending'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#78716C]">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {booking.phone}
                        </span>
                        {booking.email && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {booking.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {booking.check_in} → {booking.check_out}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {booking.room_type}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                        </span>
                      </div>
                      {booking.special_requests && (
                        <p className="text-xs text-[#78716C] mt-2 italic">"{booking.special_requests}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                        booking.owner_notified ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#F5F5F0] text-[#78716C]'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${booking.owner_notified ? 'bg-[#1E40AF]' : 'bg-[#A8A29E]'}`}></div>
                        {booking.owner_notified ? 'Seen' : 'New'}
                      </div>

                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            disabled={updating === booking.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#059669] text-white rounded-md text-xs font-medium hover:bg-[#047857] transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            disabled={updating === booking.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#DC2626] border border-[#FCA5A5] rounded-md text-xs font-medium hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          disabled={updating === booking.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#DC2626] border border-[#FCA5A5] rounded-md text-xs font-medium hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] transition-colors"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E8E5DE] flex items-center justify-between text-xs text-[#78716C]">
                    <span>Received {new Date(booking.created_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {!booking.owner_notified && (
                      <button
                        onClick={() => markOwnerNotified(booking.id)}
                        className="text-[#1C1917] hover:underline"
                      >
                        Mark as seen
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-[#E8E5DE] px-6 py-4 flex items-center justify-between">
                <h3 className="font-medium text-[#1C1917]">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-[#78716C] hover:text-[#1C1917]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Detail label="Guest Name" value={selectedBooking.guest_name} />
                  <Detail label="Phone" value={selectedBooking.phone} />
                  <Detail label="Email" value={selectedBooking.email || '—'} />
                  <Detail label="Guests" value={String(selectedBooking.guests)} />
                  <Detail label="Check-in" value={selectedBooking.check_in} />
                  <Detail label="Check-out" value={selectedBooking.check_out} />
                  <Detail label="Room Type" value={selectedBooking.room_type} />
                  <Detail label="Status" value={selectedBooking.status} />
                </div>
                {selectedBooking.special_requests && (
                  <div>
                    <p className="text-xs text-[#78716C] uppercase tracking-wider mb-1">Special Requests</p>
                    <p className="text-[#1C1917] text-sm bg-[#FAFAF7] p-3 rounded-md border border-[#E8E5DE]">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-[#E8E5DE] flex gap-2">
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1C1917] text-[#FAFAF7] rounded-md text-xs font-medium hover:bg-[#292524] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Guest
                  </a>
                  {selectedBooking.email && (
                    <a
                      href={`mailto:${selectedBooking.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#FAFAF7] text-[#1C1917] border border-[#E8E5DE] rounded-md text-xs font-medium hover:bg-[#F5F5F0] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Guest
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#78716C] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[#1C1917] text-sm font-medium">{value}</p>
    </div>
  );
}
