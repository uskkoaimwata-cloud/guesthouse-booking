import { motion } from 'framer-motion';

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

interface Props {
  bookings: Booking[];
  loading: boolean;
  updating: string | null;
  emailErrors: Record<string, string>;
  searchTerm: string;
  filter: string;
  onUpdateStatus: (id: string, status: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onNotifyOwner: (booking: Booking) => void;
  buildWhatsAppLink: (phone: string, message: string) => string;
  buildWhatsAppMessage: (booking: Booking, type: 'confirmed' | 'declined') => string;
}

export default function BookingList({ bookings, loading, updating, emailErrors, onUpdateStatus, onSelectBooking, onNotifyOwner, buildWhatsAppLink, buildWhatsAppMessage }: Props) {
  if (loading && bookings.length === 0) {
    return (
      <div className="bg-white border border-[#E8E5DE] rounded-lg p-16 text-center">
        <div className="w-8 h-8 border-2 border-[#E8E5DE] border-t-[#1C1917] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#78716C] text-sm">Loading bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-[#E8E5DE] rounded-lg p-16 text-center">
        <svg className="w-12 h-12 text-[#D6D3D1] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-[#1C1917] font-medium mb-1">No bookings found</h3>
        <p className="text-[#78716C] text-sm">Bookings will appear here in real-time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking, index) => {
        const waLink = buildWhatsAppLink(booking.phone, buildWhatsAppMessage(booking, booking.status === 'confirmed' ? 'confirmed' : 'declined'));
        return (
          <motion.div key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}
            className="bg-white border border-[#E8E5DE] rounded-lg hover:border-[#A8A29E] transition-colors">
            <div className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-[#1C1917]">{booking.guest_name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-[#D1FAE5] text-[#065F46]'
                      : booking.status === 'pending' ? 'bg-[#FEF3C7] text-[#92400E]'
                      : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                      {booking.status}
                    </span>
                    {!booking.email && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">WhatsApp only</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#78716C]">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {booking.phone}
                    </span>
                    {booking.email && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {booking.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {booking.check_in} → {booking.check_out}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      {booking.room_type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                    </span>
                  </div>
                  {booking.special_requests && <p className="text-xs text-[#78716C] mt-2 italic">&quot;{booking.special_requests}&quot;</p>}
                  {emailErrors[booking.id] && (
                    <p className="text-xs text-[#DC2626] mt-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {emailErrors[booking.id]}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${booking.owner_notified ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#F5F5F0] text-[#78716C]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${booking.owner_notified ? 'bg-[#1E40AF]' : 'bg-[#A8A29E]'}`}></div>
                    {booking.owner_notified ? 'Seen' : 'New'}
                  </div>

                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] text-white rounded-md text-xs font-medium hover:bg-[#20BA5A] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp
                  </a>

                  {booking.status === 'pending' && (
                    <>
                      <button onClick={() => onUpdateStatus(booking.id, 'confirmed')} disabled={updating === booking.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#059669] text-white rounded-md text-xs font-medium hover:bg-[#047857] transition-colors disabled:opacity-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Confirm
                      </button>
                      <button onClick={() => onUpdateStatus(booking.id, 'cancelled')} disabled={updating === booking.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#DC2626] border border-[#FCA5A5] rounded-md text-xs font-medium hover:bg-[#FEF2F2] transition-colors disabled:opacity-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Decline
                      </button>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <button onClick={() => onUpdateStatus(booking.id, 'cancelled')} disabled={updating === booking.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#DC2626] border border-[#FCA5A5] rounded-md text-xs font-medium hover:bg-[#FEF2F2] transition-colors disabled:opacity-50">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Cancel
                    </button>
                  )}

                  <button onClick={() => onSelectBooking(booking)} className="p-1.5 text-[#78716C] hover:text-[#1C1917] transition-colors" title="View details">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E8E5DE] flex items-center justify-between text-xs text-[#78716C]">
                <span>Received {new Date(booking.created_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                {!booking.owner_notified && (
                  <button onClick={() => onNotifyOwner(booking)} className="text-[#1C1917] hover:underline">Notify owner</button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
