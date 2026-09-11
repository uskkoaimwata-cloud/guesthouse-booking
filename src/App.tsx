import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Home,
  CheckCircle,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  Bed,
  TrendingUp,
  Eye,
  X,
} from 'lucide-react';

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
      setLoginError('Incorrect password. Please try again.');
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
      <div className="min-h-screen bg-[#f8f5ef] flex items-center justify-center p-4" style={{ fontFamily: "'Jost', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#122f3d] rounded-lg mb-4">
              <Bed size={28} className="text-[#c19a5b]" />
            </div>
            <h1 className="text-2xl font-medium text-[#122f3d]" style={{ fontFamily: "'Playfair Display', serif" }}>
              La Coastal Admin
            </h1>
            <p className="text-sm text-[#6e7d83] mt-2">Private access — authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-[#e4ddd0] rounded-sm p-8 shadow-sm">
            <label className="block text-xs font-medium tracking-widest uppercase text-[#122f3d] mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-[#e4ddd0] rounded-sm bg-white focus:outline-none focus:border-[#c19a5b] transition-colors"
              autoFocus
            />
            {loginError && (
              <p className="text-red-600 text-sm mt-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full mt-6 bg-[#122f3d] text-white py-3.5 rounded-sm text-xs font-medium tracking-widest uppercase hover:bg-[#1a3f52] transition-colors"
            >
              Access Dashboard
            </button>
            <p className="text-xs text-[#6e7d83] text-center mt-4">
              This panel is private. Only the business owner can access booking data.
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef]" style={{ fontFamily: "'Jost', sans-serif" }}>
      <header className="bg-[#0c2330] border-b border-[#c19a5b]/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bed size={20} className="text-[#c19a5b]" />
            <div>
              <h1 className="text-white text-sm font-medium tracking-wide">La Coastal — Admin</h1>
              <p className="text-[#6e7d83] text-xs">Booking Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              className="p-2 text-[#cfdade] hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#cfdade] hover:text-white border border-[#6e7d83]/30 rounded-sm transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, icon: Calendar, color: '#122f3d' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: '#c19a5b' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: '#2d7a4f' },
            { label: 'This Month', value: stats.thisMonth, icon: TrendingUp, color: '#122f3d' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-[#e4ddd0] rounded-sm p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#6e7d83] tracking-wider uppercase">{stat.label}</p>
                  <p className="text-3xl font-medium text-[#122f3d] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon size={20} style={{ color: stat.color }} className="opacity-60" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-[#e4ddd0] rounded-sm p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7d83]" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#e4ddd0] rounded-sm text-sm focus:outline-none focus:border-[#c19a5b]"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-sm text-xs tracking-wider uppercase transition-colors ${
                  filter === f
                    ? 'bg-[#122f3d] text-white'
                    : 'bg-[#f8f5ef] text-[#6e7d83] hover:bg-[#efe9dd]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && bookings.length === 0 ? (
          <div className="bg-white border border-[#e4ddd0] rounded-sm p-16 text-center">
            <RefreshCw size={24} className="text-[#c19a5b] mx-auto mb-3 animate-spin" />
            <p className="text-[#6e7d83] text-sm">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-[#e4ddd0] rounded-sm p-16 text-center">
            <Calendar size={28} className="text-[#6e7d83] mx-auto mb-3 opacity-50" />
            <h3 className="text-[#122f3d] font-medium">No bookings found</h3>
            <p className="text-[#6e7d83] text-sm mt-1">
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
                className="bg-white border border-[#e4ddd0] rounded-sm hover:border-[#c19a5b]/40 transition-colors"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-[#122f3d]">{booking.guest_name}</h3>
                        <span className={`px-2 py-0.5 rounded-sm text-xs tracking-wider uppercase ${
                          booking.status === 'confirmed'
                            ? 'bg-[#2d7a4f]/10 text-[#2d7a4f]'
                            : booking.status === 'pending'
                            ? 'bg-[#c19a5b]/10 text-[#8b6d3f]'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#6e7d83]">
                        <span className="flex items-center gap-1.5"><Phone size={13} /> {booking.phone}</span>
                        {booking.email && <span className="flex items-center gap-1.5"><Mail size={13} /> {booking.email}</span>}
                        <span className="flex items-center gap-1.5"><Calendar size={13} /> {booking.check_in} → {booking.check_out}</span>
                        <span className="flex items-center gap-1.5"><Home size={13} /> {booking.room_type}</span>
                        <span className="flex items-center gap-1.5"><Users size={13} /> {booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                      </div>
                      {booking.special_requests && (
                        <p className="text-xs text-[#6e7d83] mt-2 italic">"{booking.special_requests}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs ${
                        booking.owner_notified ? 'bg-blue-50 text-blue-700' : 'bg-[#f8f5ef] text-[#6e7d83]'
                      }`}>
                        <Mail size={11} />
                        {booking.owner_notified ? 'Seen' : 'New'}
                      </div>

                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            disabled={updating === booking.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#2d7a4f] text-white rounded-sm text-xs tracking-wider uppercase hover:bg-[#246840] transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            disabled={updating === booking.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-sm text-xs tracking-wider uppercase hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <X size={12} /> Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          disabled={updating === booking.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-sm text-xs tracking-wider uppercase hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <X size={12} /> Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-1.5 text-[#6e7d83] hover:text-[#122f3d] transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#e4ddd0] flex items-center justify-between text-xs text-[#6e7d83]">
                    <span>Received {new Date(booking.created_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {!booking.owner_notified && (
                      <button
                        onClick={() => markOwnerNotified(booking.id)}
                        className="text-[#c19a5b] hover:text-[#8b6d3f] transition-colors"
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
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#0c2330] px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-medium">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-white/60 hover:text-white">
                  <X size={20} />
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
                    <p className="text-xs text-[#6e7d83] tracking-wider uppercase mb-1">Special Requests</p>
                    <p className="text-[#122f3d] text-sm bg-[#f8f5ef] p-3 rounded-sm border border-[#e4ddd0]">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-[#e4ddd0] flex gap-2">
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#122f3d] text-white rounded-sm text-xs tracking-wider uppercase hover:bg-[#1a3f52] transition-colors"
                  >
                    <Phone size={14} /> Call Guest
                  </a>
                  {selectedBooking.email && (
                    <a
                      href={`mailto:${selectedBooking.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#c19a5b] text-[#0c2330] rounded-sm text-xs tracking-wider uppercase font-medium hover:bg-[#d3af74] transition-colors"
                    >
                      <Mail size={14} /> Email Guest
                    </a>
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Home,
  CheckCircle,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  Bed,
  TrendingUp,
  Eye,
  X,
} from 'lucide-react';

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
      setLoginError('Incorrect password. Please try again.');
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
      <div className="min-h-screen bg-[#f8f5ef] flex items-center justify-center p-4" style={{ fontFamily: "'Jost', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#122f3d] rounded-lg mb-4">
              <Bed size={28} className="text-[#c19a5b]" />
            </div>
            <h1 className="text-2xl font-medium text-[#122f3d]" style={{ fontFamily: "'Playfair Display', serif" }}>
              La Coastal Admin
            </h1>
            <p className="text-sm text-[#6e7d83] mt-2">Private access — authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-[#e4ddd0] rounded-sm p-8 shadow-sm">
            <label className="block text-xs font-medium tracking-widest uppercase text-[#122f3d] mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-[#e4ddd0] rounded-sm bg-white focus:outline-none focus:border-[#c19a5b] transition-colors"
              autoFocus
            />
            {loginError && (
              <p className="text-red-600 text-sm mt-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full mt-6 bg-[#122f3d] text-white py-3.5 rounded-sm text-xs font-medium tracking-widest uppercase hover:bg-[#1a3f52] transition-colors"
            >
              Access Dashboard
            </button>
            <p className="text-xs text-[#6e7d83] text-center mt-4">
              This panel is private. Only the business owner can access booking data.
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef]" style={{ fontFamily: "'Jost', sans-serif" }}>
      <header className="bg-[#0c2330] border-b border-[#c19a5b]/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bed size={20} className="text-[#c19a5b]" />
            <div>
              <h1 className="text-white text-sm font-medium tracking-wide">La Coastal — Admin</h1>
              <p className="text-[#6e7d83] text-xs">Booking Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              className="p-2 text-[#cfdade] hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#cfdade] hover:text-white border border-[#6e7d83]/30 rounded-sm transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, icon: Calendar, color: '#122f3d' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: '#c19a5b' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: '#2d7a4f' },
            { label: 'This Month', value: stats.thisMonth, icon: TrendingUp, color: '#122f3d' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-[#e4ddd0] rounded-sm p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#6e7d83] tracking-wider uppercase">{stat.label}</p>
                  <p className="text-3xl font-medium text-[#122f3d] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon size={20} style={{ color: stat.color }} className="opacity-60" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-[#e4ddd0] rounded-sm p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7d83]" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#e4ddd0] rounded-sm text-sm focus:outline-none focus:border-[#c19a5b]"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-sm text-xs tracking-wider uppercase transition-colors ${
                  filter === f
                    ? 'bg-[#122f3d] text-white'
                    : 'bg-[#f8f5ef] text-[#6e7d83] hover:bg-[#efe9dd]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && bookings.length === 0 ? (
          <div className="bg-white border border-[#e4ddd0] rounded-sm p-16 text-center">
            <RefreshCw size={24} className="text-[#c19a5b] mx-auto mb-3 animate-spin" />
            <p className="text-[#6e7d83] text-sm">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-[#e4ddd0] rounded-sm p-16 text-center">
            <Calendar size={28} className="text-[#6e7d83] mx-auto mb-3 opacity-50" />
            <h3 className="text-[#122f3d] font-medium">No bookings found</h3>
            <p className="text-[#6e7d83] text-sm mt-1">
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
                className="bg-white border border-[#e4ddd0] rounded-sm hover:border-[#c19a5b]/40 transition-colors"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-[#122f3d]">{booking.guest_name}</h3>
                        <span className={`px-2 py-0.5 rounded-sm text-xs tracking-wider uppercase ${
                          booking.status === 'confirmed'
                            ? 'bg-[#2d7a4f]/10 text-[#2d7a4f]'
                            : booking.status === 'pending'
                            ? 'bg-[#c19a5b]/10 text-[#8b6d3f]'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#6e7d83]">
                        <span className="flex items-center gap-1.5"><Phone size={13} /> {booking.phone}</span>
                        {booking.email && <span className="flex items-center gap-1.5"><Mail size={13} /> {booking.email}</span>}
                        <span className="flex items-center gap-1.5"><Calendar size={13} /> {booking.check_in} → {booking.check_out}</span>
                        <span className="flex items-center gap-1.5"><Home size={13} /> {booking.room_type}</span>
                        <span className="flex items-center gap-1.5"><Users size={13} /> {booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                      </div>
                      {booking.special_requests && (
                        <p className="text-xs text-[#6e7d83] mt-2 italic">"{booking.special_requests}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs ${
                        booking.owner_notified ? 'bg-blue-50 text-blue-700' : 'bg-[#f8f5ef] text-[#6e7d83]'
                      }`}>
                        <Mail size={11} />
                        {booking.owner_notified ? 'Seen' : 'New'}
                      </div>

                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            disabled={updating === booking.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#2d7a4f] text-white rounded-sm text-xs tracking-wider uppercase hover:bg-[#246840] transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            disabled={updating === booking.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-sm text-xs tracking-wider uppercase hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <X size={12} /> Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          disabled={updating === booking.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-sm text-xs tracking-wider uppercase hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <X size={12} /> Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-1.5 text-[#6e7d83] hover:text-[#122f3d] transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#e4ddd0] flex items-center justify-between text-xs text-[#6e7d83]">
                    <span>Received {new Date(booking.created_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {!booking.owner_notified && (
                      <button
                        onClick={() => markOwnerNotified(booking.id)}
                        className="text-[#c19a5b] hover:text-[#8b6d3f] transition-colors"
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
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#0c2330] px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-medium">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-white/60 hover:text-white">
                  <X size={20} />
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
                    <p className="text-xs text-[#6e7d83] tracking-wider uppercase mb-1">Special Requests</p>
                    <p className="text-[#122f3d] text-sm bg-[#f8f5ef] p-3 rounded-sm border border-[#e4ddd0]">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-[#e4ddd0] flex gap-2">
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#122f3d] text-white rounded-sm text-xs tracking-wider uppercase hover:bg-[#1a3f52] transition-colors"
                  >
                    <Phone size={14} /> Call Guest
                  </a>
                  {selectedBooking.email && (
                    <a
                      href={`mailto:${selectedBooking.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#c19a5b] text-[#0c2330] rounded-sm text-xs tracking-wider uppercase font-medium hover:bg-[#d3af74] transition-colors"
                    >
                      <Mail size={14} /> Email Guest
                    </a>
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6e7d83] tracking-wider uppercase mb-0.5">{label}</p>
      <p className="text-[#122f3d] text-sm font-medium">{value}</p>
    </div>
  );
}
