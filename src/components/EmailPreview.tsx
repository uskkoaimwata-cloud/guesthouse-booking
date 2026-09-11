import { motion } from 'framer-motion';
import { Booking } from '../types';
import { X, Mail } from 'lucide-react';

interface EmailPreviewProps {
  booking: Booking;
  type: 'owner' | 'confirmation';
  onClose: () => void;
}

export default function EmailPreview({ booking, type, onClose }: EmailPreviewProps) {
  const roomLabels: Record<string, string> = { standard: 'Standard Room', deluxe: 'Deluxe Room', suite: 'Executive Suite', family: 'Family Room' };

  const ownerEmail = {
    to: 'owner@guesthouse.com',
    from: 'system@guesthouse.com',
    subject: `New Booking — ${booking.guestName}`,
    body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="color: white; margin: 0;">🏨 New Booking Received!</h1></div><div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;"><p>Dear Owner,</p><p>A new booking has been submitted:</p><div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;"><p><strong>Guest:</strong> ${booking.guestName}</p><p><strong>Email:</strong> ${booking.email}</p><p><strong>Phone:</strong> ${booking.phone}</p><p><strong>Check-in:</strong> ${booking.checkIn}</p><p><strong>Check-out:</strong> ${booking.checkOut}</p><p><strong>Room:</strong> ${roomLabels[booking.roomType]}</p><p><strong>Guests:</strong> ${booking.guests}</p>${booking.specialRequests ? `<p><strong>Requests:</strong> ${booking.specialRequests}</p>` : ''}</div><p>Please review and send a confirmation.</p></div></div>`
  };

  const confirmationEmail = {
    to: booking.email,
    from: 'reservations@guesthouse.com',
    subject: `Booking Confirmed — ${booking.checkIn} to ${booking.checkOut}`,
    body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1></div><div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;"><p>Dear ${booking.guestName},</p><p>Great news! Your booking has been confirmed.</p><div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;"><p><strong>Confirmation #:</strong> ${booking.id.slice(0, 8).toUpperCase()}</p><p><strong>Check-in:</strong> ${booking.checkIn}</p><p><strong>Check-out:</strong> ${booking.checkOut}</p><p><strong>Room:</strong> ${roomLabels[booking.roomType]}</p><p><strong>Guests:</strong> ${booking.guests}</p></div><p>We can't wait to host you!</p><p>Warm regards,<br/>The Guesthouse Team</p></div></div>`
  };

  const email = type === 'owner' ? ownerEmail : confirmationEmail;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'owner' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}><Mail size={20} /></div>
            <div><h3 className="font-semibold">{type === 'owner' ? 'Owner Notification' : 'Guest Confirmation'}</h3><p className="text-xs text-gray-500">Email Preview</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="px-6 py-4 border-b space-y-2">
          <div className="flex gap-2 text-sm"><span className="text-gray-500 w-12">From:</span><span>{email.from}</span></div>
          <div className="flex gap-2 text-sm"><span className="text-gray-500 w-12">To:</span><span>{email.to}</span></div>
          <div className="flex gap-2 text-sm"><span className="text-gray-500 w-12">Subject:</span><span className="font-medium">{email.subject}</span></div>
        </div>
        <div className="px-6 py-6"><div dangerouslySetInnerHTML={{ __html: email.body }} /></div>
      </motion.div>
    </motion.div>
  );
}
