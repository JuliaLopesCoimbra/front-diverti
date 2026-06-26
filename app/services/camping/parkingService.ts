import api from "../auth/axiosConfig";

export interface ParkingSpot {
  id: number;
  event_id: number;
  label: string;
  x_position: number | null;
  y_position: number | null;
  capacity: number;
  is_active: boolean;
  sort_order: number;
  booked_count: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ParkingSpotCreate {
  event_id: number;
  label: string;
  x_position?: number | null;
  y_position?: number | null;
  capacity?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface ParkingSpotUpdate {
  label?: string;
  x_position?: number | null;
  y_position?: number | null;
  capacity?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface ParkingMapResponse {
  image_url: string | null;
  spots: ParkingSpot[];
}

export interface ParkingBooking {
  id: number;
  user_id: number;
  event_id: number;
  parking_spot_id: number;
  status: string;
  qr_token: string;
  spot_label: string | null;
  created_at: string;
  cancelled_at?: string | null;
}

// ── Admin ─────────────────────────────────────────────────────────────────

export const adminGetParkingSpots = async (eventId: number): Promise<ParkingSpot[]> => {
  const r = await api.get<ParkingSpot[]>(`/admin/events/${eventId}/parking-spots`);
  return r.data;
};

export const adminCreateParkingSpot = async (data: ParkingSpotCreate): Promise<ParkingSpot> => {
  const r = await api.post<ParkingSpot>("/admin/parking-spots", data);
  return r.data;
};

export const adminUpdateParkingSpot = async (spotId: number, data: ParkingSpotUpdate): Promise<ParkingSpot> => {
  const r = await api.put<ParkingSpot>(`/admin/parking-spots/${spotId}`, data);
  return r.data;
};

export const adminDeleteParkingSpot = async (spotId: number): Promise<void> => {
  await api.delete(`/admin/parking-spots/${spotId}`);
};

export const adminUpdateParkingMapImage = async (eventId: number, url: string): Promise<void> => {
  await api.patch(`/admin/events/${eventId}/parking-map-image`, { parking_map_image_url: url });
};

export const adminGenerateParkingFromCamping = async (eventId: number): Promise<ParkingSpot[]> => {
  const r = await api.post<ParkingSpot[]>(`/admin/events/${eventId}/parking/generate-from-camping`);
  return r.data;
};

export const adminGetParkingBookings = async (eventId: number): Promise<ParkingBooking[]> => {
  const r = await api.get<ParkingBooking[]>(`/admin/events/${eventId}/parking-bookings`);
  return r.data;
};

export const adminCancelParkingBooking = async (bookingId: number): Promise<void> => {
  await api.delete(`/admin/parking-bookings/${bookingId}`);
};

// ── User ──────────────────────────────────────────────────────────────────

export const getUserParkingMap = async (eventId: number): Promise<ParkingMapResponse> => {
  const r = await api.get<ParkingMapResponse>(`/user/events/${eventId}/parking-map`);
  return r.data;
};

export const getUserParkingBookingForEvent = async (eventId: number): Promise<ParkingBooking> => {
  const r = await api.get<ParkingBooking>(`/user/events/${eventId}/parking-booking`);
  return r.data;
};

export const createUserParkingBooking = async (eventId: number, parkingSpotId: number): Promise<ParkingBooking> => {
  const r = await api.post<ParkingBooking>("/user/parking-bookings", {
    event_id: eventId,
    parking_spot_id: parkingSpotId,
  });
  return r.data;
};

export const cancelUserParkingBooking = async (bookingId: number): Promise<void> => {
  await api.delete(`/user/parking-bookings/${bookingId}`);
};
