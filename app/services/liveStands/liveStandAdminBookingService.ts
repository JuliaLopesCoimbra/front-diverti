import api from "../auth/axiosConfig";

export interface AdminStandSessionBooking {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  created_at: string;
  checked_in_at?: string | null;
  checked_in_by_admin_id?: number | null;
}

export const getAdminStandSessionBookings = async (
  sessionId: number
): Promise<AdminStandSessionBooking[]> => {
  const response = await api.get<AdminStandSessionBooking[]>(
    `/admin/event-stand-sessions/${sessionId}/bookings`
  );
  return response.data;
};

export const checkInAdminStandBooking = async (bookingId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/admin/event-stand-bookings/${bookingId}/check-in`);
  return response.data;
};

export const checkInAdminStandBookingByToken = async (
  token: string
): Promise<{ message: string; booking_id: number }> => {
  const response = await api.post<{ message: string; booking_id: number }>(
    "/admin/event-stand-bookings/check-in-by-token",
    { token }
  );
  return response.data;
};

export default {
  getAdminStandSessionBookings,
  checkInAdminStandBooking,
  checkInAdminStandBookingByToken,
};
