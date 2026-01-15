import api from "../auth/axiosConfig";
import axios from "axios";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  location?: string;
  banner_image?: string;
  image_map?: string;
  line_up?: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  is_active: boolean;
  requires_post_approval: boolean;
  event_dates?: string; // Campo opcional para múltiplas datas (formato: "2024-01-09,2024-01-10,2024-01-20,2024-01-21" ou "09,10,20,21 de janeiro")
  deleted_at?: string;
  deleted_by_id?: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  location?: string;
  starts_at?: string;
  ends_at?: string;
  event_dates?: string; // Formato: "2024-01-09,2024-01-10,2024-01-20,2024-01-21"
  banner_image?: File;
  image_map?: File;
  line_up?: string;
}

export interface UpdateEventData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  event_dates?: string; // Formato: "2024-01-09,2024-01-10,2024-01-20,2024-01-21"
  banner_image?: File;
  image_map?: File;
  line_up?: string;
}

export const getEvents = async (): Promise<EventResponse[]> => {
  const response = await api.get<EventResponse[]>("/admin/events");
  return response.data;
};

// Função pública para buscar eventos sem autenticação
export const getPublicEvents = async (): Promise<EventResponse[]> => {
  const API_URL = getApiUrl();
  
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada");
  }
  
  const url = `${API_URL}/public/events`;
  
  try {
    const response = await axios.get<EventResponse[]>(url);
    return response.data;
  } catch (error: any) {
    console.error("Erro ao buscar eventos públicos:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("URL tentada:", url);
    }
    throw error;
  }
};

export const getEventById = async (eventId: number): Promise<EventResponse> => {
  const response = await api.get<EventResponse>(`/admin/events/${eventId}`);
  return response.data;
};

export const createEvent = async (data: CreateEventData): Promise<EventResponse> => {
  const formData = new FormData();
  formData.append("title", data.title);
  if (data.description) formData.append("description", data.description);
  if (data.location) formData.append("location", data.location);
  if (data.starts_at) formData.append("starts_at", data.starts_at);
  if (data.ends_at) formData.append("ends_at", data.ends_at);
  if (data.event_dates) formData.append("event_dates", data.event_dates);
  if (data.banner_image) formData.append("banner_image", data.banner_image);
  if (data.image_map) formData.append("image_map", data.image_map);
  if (data.line_up) formData.append("line_up", data.line_up);

  const response = await api.post<EventResponse>("/admin/events", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateEvent = async (
  eventId: number,
  data: UpdateEventData
): Promise<EventResponse> => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("location", data.location);
  formData.append("start_date", data.start_date);
  formData.append("end_date", data.end_date);
  if (data.event_dates) formData.append("event_dates", data.event_dates);
  if (data.banner_image) formData.append("banner_image", data.banner_image);
  if (data.image_map) formData.append("image_map", data.image_map);
  if (data.line_up) formData.append("line_up", data.line_up);

  const response = await api.put<EventResponse>(
    `/admin/events/${eventId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteEvent = async (eventId: number): Promise<void> => {
  await api.delete(`/admin/events/${eventId}`);
};

export const activateEvent = async (eventId: number) => {
  const response = await api.patch(`/admin/events/${eventId}/activate`);
  return response.data;
};

export const deactivateEvent = async (eventId: number) => {
  const response = await api.patch(`/admin/events/${eventId}/deactivate`);
  return response.data;
};

export const updatePostApprovalRequirement = async (
  eventId: number,
  requiresApproval: boolean
): Promise<EventResponse> => {
  const response = await api.patch<EventResponse>(
    `/admin/events/${eventId}/post-approval?requires_approval=${requiresApproval}`
  );
  return response.data;
};

export const getPendingPostsCount = async (eventId: number): Promise<{ event_id: number; pending_count: number }> => {
  const response = await api.get<{ event_id: number; pending_count: number }>(`/admin/events/${eventId}/pending-posts-count`);
  return response.data;
};

// Export default para garantir compatibilidade com diferentes sistemas de módulos
export default {
  getEvents,
  getPublicEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  activateEvent,
  deactivateEvent,
  updatePostApprovalRequirement,
  getPendingPostsCount,
};
