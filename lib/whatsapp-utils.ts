interface Booking {
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
  id: string;
}

export function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  return digits;
}

export function buildWhatsAppMessage(booking: Booking, type: 'confirmed' | 'declined' = 'confirmed'): string {
  const isConfirmed = type === 'confirmed';
  
  const greeting = isConfirmed
    ? `Hi ${booking.guest_name}, your booking at La Coastal Guesthouse is confirmed! ✅`
    : `Hi ${booking.guest_name}, we're sorry but we're unable to accommodate your booking request for the requested dates.`;

  const closing = isConfirmed
    ? 'We look forward to hosting you!'
    : 'Please feel free to contact us about alternative dates. We hope to welcome you another time!';

  return `${greeting}

Room: ${booking.room_type}
Check-in: ${booking.check_in}
Check-out: ${booking.check_out}
Guests: ${booking.guests}

Address: 5841 Omugulugombashe Circle, Kuisebmund, Walvis Bay, Namibia

Questions or changes? Reach us at:
📞 +264 81 575 7152 (reservations)
☎️ +264 64 220 503 (telephone)
✉️ lacoastalguesthouse@gmail.com

${closing}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}
