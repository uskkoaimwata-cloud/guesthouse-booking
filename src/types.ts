export interface Booking {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  guests: number;
  specialRequests: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  ownerNotified: boolean;
  confirmationSent: boolean;
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'active' | 'pending';
}
