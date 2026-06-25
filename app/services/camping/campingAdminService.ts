import api from "../auth/axiosConfig";

export interface CampingAreaResponse {
  id: number;
  event_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  total_spots: number;
  x_position?: number | null;
  y_position?: number | null;
  created_at: string;
  created_by_id: number;
  updated_at?: string | null;
  updated_by_id?: number | null;
  deleted_at?: string | null;
  deleted_by_id?: number | null;
}

export interface CampingSessionResponse {
  id: number;
  area_id: number;
  label: string;
  check_in_date: string;
  check_out_date: string;
  capacity: number;
  status: string;
  created_at: string;
  created_by_id: number;
  updated_at?: string | null;
  updated_by_id?: number | null;
  deleted_at?: string | null;
  deleted_by_id?: number | null;
  quantity_bookings: number;
  quantity_entries: number;
  quantity_missing_checkins: number;
  quantity_remaining_slots: number;
}

// ─── Areas ───────────────────────────────────────────────────────────────────

export const getCampingAreasByEvent = async (eventId: number): Promise<CampingAreaResponse[]> => {
  const response = await api.get<CampingAreaResponse[]>(`/admin/events/${eventId}/camping-areas`);
  return response.data;
};

export const getCampingAreaById = async (areaId: number): Promise<CampingAreaResponse> => {
  const response = await api.get<CampingAreaResponse>(`/admin/camping-areas/${areaId}`);
  return response.data;
};

export const createCampingArea = async (data: {
  event_id: number;
  name: string;
  description?: string;
  total_spots: number;
  image?: File | null;
  image_url?: string;
  x_position?: number;
  y_position?: number;
}): Promise<CampingAreaResponse> => {
  const formData = new FormData();
  formData.append("event_id", String(data.event_id));
  formData.append("name", data.name);
  formData.append("total_spots", String(data.total_spots));
  if (data.description) formData.append("description", data.description);
  if (data.image) formData.append("image", data.image);
  if (data.image_url) formData.append("image_url", data.image_url);
  if (data.x_position !== undefined) formData.append("x_position", String(data.x_position));
  if (data.y_position !== undefined) formData.append("y_position", String(data.y_position));

  const response = await api.post<CampingAreaResponse>("/admin/camping-areas", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCampingArea = async (
  areaId: number,
  data: { name?: string; description?: string; total_spots?: number; image?: File | null; remove_image?: boolean; image_url?: string; x_position?: number; y_position?: number }
): Promise<CampingAreaResponse> => {
  const formData = new FormData();
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.total_spots !== undefined) formData.append("total_spots", String(data.total_spots));
  if (data.remove_image !== undefined) formData.append("remove_image", String(data.remove_image));
  if (data.image) formData.append("image", data.image);
  if (data.image_url !== undefined) formData.append("image_url", data.image_url);
  if (data.x_position !== undefined) formData.append("x_position", String(data.x_position));
  if (data.y_position !== undefined) formData.append("y_position", String(data.y_position));

  const response = await api.put<CampingAreaResponse>(`/admin/camping-areas/${areaId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCampingArea = async (areaId: number): Promise<void> => {
  await api.delete(`/admin/camping-areas/${areaId}`);
};

export interface CampingBookingInfo {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_cpf?: string | null;
  created_at: string;
  checked_in_at?: string | null;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const getCampingSessionsByArea = async (areaId: number): Promise<CampingSessionResponse[]> => {
  const response = await api.get<CampingSessionResponse[]>(`/admin/camping-areas/${areaId}/sessions`);
  return response.data;
};

export const createCampingSession = async (
  areaId: number,
  data: { label: string; check_in_date: string; check_out_date: string; capacity: number; status?: string }
): Promise<CampingSessionResponse> => {
  const response = await api.post<CampingSessionResponse>(`/admin/camping-areas/${areaId}/sessions`, data);
  return response.data;
};

export const updateCampingSession = async (
  sessionId: number,
  data: { label?: string; check_in_date?: string; check_out_date?: string; capacity?: number; status?: string }
): Promise<CampingSessionResponse> => {
  const response = await api.put<CampingSessionResponse>(`/admin/camping-sessions/${sessionId}`, data);
  return response.data;
};

export const deleteCampingSession = async (sessionId: number): Promise<void> => {
  await api.delete(`/admin/camping-sessions/${sessionId}`);
};

export const getCampingSessionBookings = async (sessionId: number): Promise<CampingBookingInfo[]> => {
  const response = await api.get<CampingBookingInfo[]>(`/admin/camping-sessions/${sessionId}/bookings`);
  return response.data;
};

export const generateDailySessions = async (
  eventId: number,
  startDate: string,
  endDate: string,
  capacity = 1
): Promise<{ created: number; skipped: number; areas: number }> => {
  const response = await api.post<{ created: number; skipped: number; areas: number }>(`/admin/events/${eventId}/camping/generate-daily-sessions`, {
    start_date: startDate,
    end_date: endDate,
    capacity,
  });
  return response.data;
};
