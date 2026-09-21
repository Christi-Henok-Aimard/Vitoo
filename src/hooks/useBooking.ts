import { useState } from 'react';
import type { Booking, BookingRequest } from '../types/booking';
import { createBookingApi } from '../api/bookingApi';

export const useBooking = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const confirmBooking = async (request: BookingRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createBookingApi(request);
      setBooking(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du paiement / réservation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setBooking(null);
    setError(null);
  };

  const restoreBooking = (booking: Booking) => {
    setBooking(booking);
    setError(null);
  };

  return { booking, loading, error, confirmBooking, resetBooking, restoreBooking };
};