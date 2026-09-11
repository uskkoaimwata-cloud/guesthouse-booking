import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../types';
import { saveBooking } from '../store';
import { motion } from 'framer-motion';
import { CalendarDays, Users, Home, MessageSquare, User, Mail, Phone, Send } from 'lucide-react';

interface BookingFormProps {
  onBookingComplete: (booking: Booking) => void;
}

export default function BookingForm({ onBookingComplete }: BookingFormProps) {
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    roomType: 'standard',
    guests: 1,
    specialRequests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const roomTypes = [
    { value: 'standard', label: 'Standard Room', price: '$89/night' },
    { value: 'deluxe', label: 'Deluxe Room', price: '$129/night' },
    { value: 'suite', label: 'Executive Suite', price: '$199/night' },
    { value: 'family', label: 'Family Room', price: '$159/night' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const booking: Booking = {
      id: uuidv4(),
      ...formData,
      guests: Number(formData.guests),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ownerNotified: false,
      confirmationSent: false,
    };

    saveBooking(booking);
    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => {
      onBookingComplete(booking);
      setShowSuccess(false);
      setFormData({
        guestName: '', email: '', phone: '', checkIn: '', checkOut: '',
        roomType: 'standard', guests: 1, specialRequests: '',
      });
    }, 2000);
  };

  if (showSuccess) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Submitted!</h3>
        <p className="text-gray-600">Your reservation has been saved and the owner has been notified.</p>
      </motion.div>
    );
  }

  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Book Your Stay</h2>
        <p className="text-gray-500">Fill in your details to reserve a room at our guesthouse</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><User size={16} className="text-amber-600" /> Full Name</label>
          <input type="text" name="guestName" value={formData.guestName} onChange={handleChange} required placeholder="John Doe" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Mail size={16} className="text-amber-600" /> Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Phone size={16} className="text-amber-600" /> Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 (555) 123-4567" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><CalendarDays size={16} className="text-amber-600" /> Check-in Date</label>
          <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><CalendarDays size={16} className="text-amber-600" /> Check-out Date</label>
          <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Home size={16} className="text-amber-600" /> Room Type</label>
          <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none">
            {roomTypes.map(rt => (<option key={rt.value} value={rt.value}>{rt.label} — {rt.price}</option>))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Users size={16} className="text-amber-600" /> Number of Guests</label>
          <input type="number" name="guests" value={formData.guests} onChange={handleChange} min={1} max={10} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><MessageSquare size={16} className="text-amber-600" /> Special Requests (Optional)</label>
          <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows={3} placeholder="Any special requirements..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none" />
        </div>
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-8 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-70">
        {isSubmitting ? (<><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Processing...</>) : (<><Send size={18} /> Submit Booking Request</>)}
      </button>
    </motion.form>
  );
}
