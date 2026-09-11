import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getBookings } from '../store';
import { Database, Table, FileSpreadsheet } from 'lucide-react';

export default function DatabaseView() {
  const [bookings, setBookings] = useState(getBookings());

  useEffect(() => {
    const interval = setInterval(() => setBookings(getBookings()), 1000);
    return () => clearInterval(interval);
  }, []);

  const roomLabels: Record<string, string> = { standard: 'Standard', deluxe: 'Deluxe', suite: 'Suite', family: 'Family' };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={22} className="text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Booking Database</h2>
              <p className="text-emerald-100 text-sm">Simulated spreadsheet view</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <Database size={28} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No records yet</h3>
              <p className="text-gray-500 text-sm">Booking data will appear here once reservations are made.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Guest</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Check-in</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Check-out</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Room</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Guests</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <motion.tr key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="border-b border-gray-100 hover:bg-amber-50/50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{booking.guestName}</td>
                    <td className="px-4 py-3 text-gray-600">{booking.email}</td>
                    <td className="px-4 py-3 text-gray-600">{booking.checkIn}</td>
                    <td className="px-4 py-3 text-gray-600">{booking.checkOut}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{roomLabels[booking.roomType]}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-center">{booking.guests}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{booking.status}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {bookings.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500"><Table size={14} /><span>{bookings.length} records</span></div>
            <div className="text-xs text-gray-400">Auto-synced</div>
          </div>
        )}
      </div>
    </div>
  );
}
