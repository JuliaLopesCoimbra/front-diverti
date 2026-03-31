import api from "../auth/axiosConfig";

export interface LiveStandResponse {
  id: number;
  event_id: number;
  name: string;
  image_url?: string | null;
  description?: string | null;
  created_at: string;
  created_by_id: number;
  updated_at?: string | null;
  updated_by_id?: number | null;
  deleted_at?: string | null;
  deleted_by_id?: number | null;
}

export interface CreateLiveStandData {
  event_id: number;
  name: string;
  description?: string;
  image?: File | null;
}

export interface UpdateLiveStandData {
  name?: string;
  description?: string;
  image?: File | null;
  remove_image?: boolean;
}

export const getLiveStandsByEvent = async (eventId: number): Promise<LiveStandResponse[]> => {
  const response = await api.get<LiveStandResponse[]>(`/admin/events/${eventId}/event-stands`);
  return response.data;
};

export const getLiveStandById = async (standId: number): Promise<LiveStandResponse> => {
  const response = await api.get<LiveStandResponse>(`/admin/event-stands/${standId}`);
  return response.data;
};

export const createLiveStand = async (data: CreateLiveStandData): Promise<LiveStandResponse> => {
  const formData = new FormData();
  formData.append("event_id", String(data.event_id));
  formData.append("name", data.name);
  if (data.description) {
    formData.append("description", data.description);
  }
  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await api.post<LiveStandResponse>("/admin/event-stands", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateLiveStand = async (
  standId: number,
  data: UpdateLiveStandData
): Promise<LiveStandResponse> => {
  const formData = new FormData();

  if (data.name !== undefined) {
    formData.append("name", data.name);
  }
  if (data.description !== undefined) {
    formData.append("description", data.description);
  }
  if (data.remove_image !== undefined) {
    formData.append("remove_image", String(data.remove_image));
  }
  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await api.put<LiveStandResponse>(`/admin/event-stands/${standId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteLiveStand = async (standId: number): Promise<void> => {
  await api.delete(`/admin/event-stands/${standId}`);
};

export default {
  getLiveStandsByEvent,
  getLiveStandById,
  createLiveStand,
  updateLiveStand,
  deleteLiveStand,
};
