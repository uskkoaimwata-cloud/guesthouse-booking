import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../types';
import { getBookings, updateBooking, deleteBooking } from '../store';
import EmailPreview from './EmailPreview';
import { Calendar, Mail, CheckCircle, Clock, Trash2, Eye, Bell, Users, Home, Search, Filter, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  highlightBookingId?: string;
}

export default function AdminDashboard({ highlightBookingId }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emailPreview, setEmailPreview] = useState<{ booking: Booking; type: 'owner' | 'confirmation' } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = () => { setBookings(getBookings()); };

  const handleSendOwnerNotification = async (booking: Booking) => {
    setSendingEmail(booking.id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateBooking(booking.id, { ownerNotified: true });
    setSendingEmail(null);
    loadBookings();
  };

  const handleSendConfirmation = async (booking: Booking) => {
    setSendingEmail(booking.id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateBooking(booking.id, { confirmationSent: true, status: 'confirmed' });
    setSendingEmail(null);
    loadBookings();
  };

  const handleDelete = (id: string) => { deleteBooking(id); loadBookings(); };

  const filteredBookings = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) || b.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const roomLabels: Record<string, string> = { standard: 'Standard', deluxe: 'Deluxe', suite: 'Suite', family: 'Family' };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: bookings.length, icon: <Calendar size={20} className="text-blue-600" />, bg: 'bg-blue-100' },
          { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: <Clock size={20} className="text-amber-600" />, bg: 'bg-amber-100' },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: <CheckCircle size={20} className="text-green-600" />, bg: 'bg-green-100' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, icon: <AlertCircle size={20} className="text-red-600" />, bg: 'bg-red-100' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>{stat.icon}</div>
              <div><p className="text-2xl font-bold text-gray-800">{stat.value}</p><p className="text-xs text-gray-500">{stat.label}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={28} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No bookings yet</h3>
          <p className="text-gray-500 text-sm">Bookings will appear here once guests submit reservations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredBookings.map((booking) => (
              <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-xl shadow-sm border ${highlightBookingId === booking.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}>
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{booking.guestName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{booking.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Mail size={14} /> {booking.email}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> {booking.checkIn} → {booking.checkOut}</span>
                        <span className="flex items-center gap-1"><Home size={14} /> {roomLabels[booking.roomType]}</span>
                        <span className="flex items-center gap-1"><Users size={14} /> {booking.guests}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${booking.ownerNotified ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Bell size={12} /> {booking.ownerNotified ? 'Notified' : 'Pending'}
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${booking.confirmationSent ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <CheckCircle size={12} /> {booking.confirmationSent ? 'Confirmed' : 'Unconfirmed'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => setEmailPreview({ booking, type: 'owner' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                      <Eye size={14} /> Preview Owner Email
                    </button>
                    <button onClick={() => setEmailPreview({ booking, type: 'confirmation' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100">
                      <Eye size={14} /> Preview Confirmation
                    </button>
                    {!booking.ownerNotified && (
                      <button onClick={() => handleSendOwnerNotification(booking)} disabled={sendingEmail === booking.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50">
                        <Bell size={14} /> Send Owner Alert
                      </button>
                    )}
                    {!booking.confirmationSent && booking.status === 'pending' && (
                      <button onClick={() => handleSendConfirmation(booking)} disabled={sendingEmail === booking.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50">
                        <Mail size={14} /> Send Confirmation
                      </button>
                    )}
                    <button onClick={() => handleDelete(booking.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 ml-auto">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {emailPreview && <EmailPreview booking={emailPreview.booking} type={emailPreview.type} onClose={() => setEmailPreview(null)} />}
      </AnimatePresence>
    </div>
  );
}
