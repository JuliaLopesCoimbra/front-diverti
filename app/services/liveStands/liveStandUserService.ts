import api from "../auth/axiosConfig";

export interface UserStandSession {
  id: number;
  stand_id: number;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  booking_open_time?: string | null;
  capacity: number;
  status: string;
  booked_slots: number;
  remaining_slots: number;
  is_booked: boolean;
}

export interface UserEventStand {
  id: number;
  event_id: number;
  name: string;
  image_url?: string | null;
  description?: string | null;
  sessions: UserStandSession[];
}

export interface UserStandBooking {
  id: number;
  user_id: number;
  stand_session_id: number;
  created_at: string;
  cancelled_at?: string | null;
  checked_in_at?: string | null;
  checked_in_by_admin_id?: number | null;
  stand_id: number;
  stand_name: string;
  stand_image_url?: string | null;
  event_id: number;
  event_title?: string | null;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  booking_open_time?: string | null;
  status: string;
  qr_token?: string | null;
}

export const getUserEventStands = async (eventId: number): Promise<UserEventStand[]> => {
  const response = await api.get<UserEventStand[]>(`/user/events/${eventId}/stands`);
  return response.data;
};

export const createUserStandBooking = async (standSessionId: number): Promise<UserStandBooking> => {
  const response = await api.post<UserStandBooking>("/user/stand-bookings", {
    stand_session_id: standSessionId,
  });
  return response.data;
};

export const getMyStandBookings = async (): Promise<UserStandBooking[]> => {
  const response = await api.get<UserStandBooking[]>("/user/stand-bookings");
  return response.data;
};

export const cancelMyStandBooking = async (bookingId: number): Promise<void> => {
  await api.delete(`/user/stand-bookings/${bookingId}`);
};

export default {
  getUserEventStands,
  createUserStandBooking,
  getMyStandBookings,
  cancelMyStandBooking,
};
