port { Booking } from './types';

const STORAGE_KEY = 'guesthouse_bookings';

export function getBookings(): Booking[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveBooking(booking: Booking): void {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function updateBooking(id: string, updates: Partial<Booking>): void {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index] = { ...bookings[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }
}

export function deleteBooking(id: string): void {
  const bookings = getBookings().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}
