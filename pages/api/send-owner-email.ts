import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { booking } = req.body;
    if (!booking) return res.status(400).json({ error: 'Booking data required' });

    const adminUrl = process.env.ADMIN_PANEL_URL || 'https://guesthouse-booking-amber.vercel.app';

    const emailBody = `New booking request received:

Guest: ${booking.guest_name}
Phone: ${booking.phone}
Email: ${booking.email || 'not provided'}
Guests: ${booking.guests}
Dates: ${booking.check_in} to ${booking.check_out}
Room: ${booking.room_type}
Notes: ${booking.special_requests || 'none'}

Review it in the admin panel: ${adminUrl}`;

    const data = await resend.emails.send({
      from: 'La Coastal Guesthouse <notifications@resend.dev>',
      to: ['lacoastalguesthouse@gmail.com'],
      subject: `New booking request - La Coastal - ${booking.guest_name}`,
      text: emailBody,
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending owner email:', error);
    return res.status(500).json({ error: error.message });
  }
}
