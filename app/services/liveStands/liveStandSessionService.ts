import api from "../auth/axiosConfig";

export interface LiveStandSessionResponse {
  id: number;
  stand_id: number;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  booking_open_time?: string | null;
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

export interface CreateLiveStandSessionData {
  session_date: string;
  start_time: string;
  end_time?: string;
  booking_open_time?: string;
  capacity: number;
  status?: string;
}

export interface UpdateLiveStandSessionData {
  session_date?: string;
  start_time?: string;
  end_time?: string;
  booking_open_time?: string;
  capacity?: number;
  status?: string;
}

export const getLiveStandSessions = async (standId: number): Promise<LiveStandSessionResponse[]> => {
  const response = await api.get<LiveStandSessionResponse[]>(`/admin/event-stands/${standId}/sessions`);
  return response.data;
};

export const getLiveStandSessionById = async (sessionId: number): Promise<LiveStandSessionResponse> => {
  const response = await api.get<LiveStandSessionResponse>(`/admin/event-stand-sessions/${sessionId}`);
  return response.data;
};

export const createLiveStandSession = async (
  standId: number,
  data: CreateLiveStandSessionData
): Promise<LiveStandSessionResponse> => {
  const formData = new FormData();
  formData.append("session_date", data.session_date);
  formData.append("start_time", data.start_time);
  if (data.end_time) {
    formData.append("end_time", data.end_time);
  }
  if (data.booking_open_time) {
    formData.append("booking_open_time", data.booking_open_time);
  }
  formData.append("capacity", String(data.capacity));
  formData.append("status", data.status || "active");

  const response = await api.post<LiveStandSessionResponse>(
    `/admin/event-stands/${standId}/sessions`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const updateLiveStandSession = async (
  sessionId: number,
  data: UpdateLiveStandSessionData
): Promise<LiveStandSessionResponse> => {
  const formData = new FormData();

  if (data.session_date !== undefined) {
    formData.append("session_date", data.session_date);
  }
  if (data.start_time !== undefined) {
    formData.append("start_time", data.start_time);
  }
  if (data.end_time !== undefined) {
    formData.append("end_time", data.end_time);
  }
  if (data.booking_open_time !== undefined) {
    formData.append("booking_open_time", data.booking_open_time);
  }
  if (data.capacity !== undefined) {
    formData.append("capacity", String(data.capacity));
  }
  if (data.status !== undefined) {
    formData.append("status", data.status);
  }

  const response = await api.put<LiveStandSessionResponse>(
    `/admin/event-stand-sessions/${sessionId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const deleteLiveStandSession = async (sessionId: number): Promise<void> => {
  await api.delete(`/admin/event-stand-sessions/${sessionId}`);
};

export default {
  getLiveStandSessions,
  getLiveStandSessionById,
  createLiveStandSession,
  updateLiveStandSession,
  deleteLiveStandSession,
};
