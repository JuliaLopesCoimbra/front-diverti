import api from "../auth/axiosConfig";

export interface UserCampingSession {
  id: number;
  area_id: number;
  label: string;
  check_in_date: string;
  check_out_date: string;
  capacity: number;
  status: string;
  booked_slots: number;
  remaining_slots: number;
  is_booked: boolean;
}

export interface UserCampingArea {
  id: number;
  event_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  total_spots: number;
  x_position?: number | null;
  y_position?: number | null;
  sessions: UserCampingSession[];
}

export interface UserCampingBooking {
  id: number;
  user_id: number;
  camping_session_id: number;
  created_at: string;
  cancelled_at?: string | null;
  checked_in_at?: string | null;
  checked_in_by_admin_id?: number | null;
  area_id: number;
  area_name: string;
  area_image_url?: string | null;
  event_id: number;
  event_title?: string | null;
  label: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  qr_token?: string | null;
}

export const getUserCampingAreas = async (eventId: number): Promise<UserCampingArea[]> => {
  const response = await api.get<UserCampingArea[]>(`/user/events/${eventId}/camping-areas`);
  return response.data;
};

export const createUserCampingBooking = async (campingSessionId: number): Promise<UserCampingBooking> => {
  const response = await api.post<UserCampingBooking>("/user/camping-bookings", {
    camping_session_id: campingSessionId,
  });
  return response.data;
};

export const bookCampingAreaDay = async (areaId: number, dateIso: string): Promise<UserCampingBooking> => {
  const response = await api.post<UserCampingBooking>(`/user/camping-areas/${areaId}/book-day`, {
    date: dateIso,
  });
  return response.data;
};

export const getMyCampingBookings = async (): Promise<UserCampingBooking[]> => {
  const response = await api.get<UserCampingBooking[]>("/user/camping-bookings");
  return response.data;
};

export const cancelMyCampingBooking = async (bookingId: number): Promise<void> => {
  await api.delete(`/user/camping-bookings/${bookingId}`);
};
