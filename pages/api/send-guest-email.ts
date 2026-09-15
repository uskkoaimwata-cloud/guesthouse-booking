import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { booking, type } = req.body;
    if (!booking || !type) return res.status(400).json({ error: 'Booking data and type required' });
    if (!booking.email) return res.status(400).json({ error: 'Guest email not provided' });

    const isConfirmed = type === 'confirmed';
    
    const greeting = isConfirmed
      ? `Hi ${booking.guest_name}, your booking at La Coastal Guesthouse is confirmed!`
      : `Hi ${booking.guest_name}, we're sorry but we're unable to accommodate your booking request for the requested dates.`;

    const closing = isConfirmed
      ? 'We look forward to hosting you!'
      : 'Please feel free to contact us about alternative dates. We hope to welcome you another time!';

    const emailBody = `${greeting}

Room: ${booking.room_type}
Check-in: ${booking.check_in}
Check-out: ${booking.check_out}
Guests: ${booking.guests}

Address: 5841 Omugulugombashe Circle, Kuisebmund, Walvis Bay, Namibia

Questions or changes? Reach us at:
Phone: +264 81 575 7152 (reservations)
Phone: +264 64 220 503 (telephone)
Email: lacoastalguesthouse@gmail.com

${closing}`;

    const subject = isConfirmed 
      ? `Booking Confirmed - La Coastal Guesthouse`
      : `Booking Update - La Coastal Guesthouse`;

    const data = await resend.emails.send({
      from: 'La Coastal Guesthouse <notifications@resend.dev>',
      to: [booking.email],
      subject,
      text: emailBody,
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending guest email:', error);
    return res.status(500).json({ error: error.message });
  }
}
