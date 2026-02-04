import api from "../auth/axiosConfig";
import axios from "axios";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

export interface LineupItemResponse {
  id: number;
  event_id: number;
  artist_name: string;
  artist_image_url?: string;
  performance_time: string; // Formato: HH:mm:ss
  display_order: number;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateLineupItemData {
  event_id: number;
  artist_name: string;
  performance_time: string; // Formato: HH:mm
  display_order?: number;
  artist_image?: File;
  description?: string;
}

export interface UpdateLineupItemData {
  artist_name?: string;
  performance_time?: string; // Formato: HH:mm
  display_order?: number;
  artist_image?: File;
  remove_image?: boolean;
  description?: string;
}

// Função pública para buscar lineup de um evento (sem autenticação)
export const getLineupItemsByEvent = async (eventId: number): Promise<LineupItemResponse[]> => {
  const API_URL = getApiUrl();
  
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada");
  }
  
  const url = `${API_URL}/public/events/${eventId}/lineup-items`;
  
  try {
    const response = await axios.get<LineupItemResponse[]>(url);
    return response.data;
  } catch (error: any) {
    console.error("Erro ao buscar lineup do evento:", error);
    throw error;
  }
};

// Função autenticada para buscar lineup (admin)
export const getLineupItemsByEventAdmin = async (eventId: number): Promise<LineupItemResponse[]> => {
  const response = await api.get<LineupItemResponse[]>(`/admin/events/${eventId}/lineup-items`);
  return response.data;
};

// Função para buscar um item específico do lineup
export const getLineupItem = async (lineupItemId: number): Promise<LineupItemResponse> => {
  const response = await api.get<LineupItemResponse>(`/admin/lineup-items/${lineupItemId}`);
  return response.data;
};

// Função para criar um item do lineup
export const createLineupItem = async (data: CreateLineupItemData): Promise<LineupItemResponse> => {
  const formData = new FormData();
  formData.append("event_id", data.event_id.toString());
  formData.append("artist_name", data.artist_name);
  formData.append("performance_time", data.performance_time);
  if (data.display_order !== undefined) {
    formData.append("display_order", data.display_order.toString());
  }
  if (data.artist_image) {
    formData.append("artist_image", data.artist_image);
  }
  if (data.description !== undefined && data.description !== null) {
    formData.append("description", data.description);
  }

  const response = await api.post<LineupItemResponse>("/admin/lineup-items", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Função para atualizar um item do lineup
export const updateLineupItem = async (
  lineupItemId: number,
  data: UpdateLineupItemData
): Promise<LineupItemResponse> => {
  const formData = new FormData();
  
  if (data.artist_name !== undefined) {
    formData.append("artist_name", data.artist_name);
  }
  if (data.performance_time !== undefined) {
    formData.append("performance_time", data.performance_time);
  }
  if (data.display_order !== undefined) {
    formData.append("display_order", data.display_order.toString());
  }
  if (data.artist_image) {
    formData.append("artist_image", data.artist_image);
  }
  if (data.remove_image !== undefined) {
    formData.append("remove_image", data.remove_image.toString());
  }
  if (data.description !== undefined) {
    formData.append("description", data.description || "");
  }

  const response = await api.put<LineupItemResponse>(`/admin/lineup-items/${lineupItemId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Função para deletar um item do lineup
export const deleteLineupItem = async (lineupItemId: number): Promise<void> => {
  await api.delete(`/admin/lineup-items/${lineupItemId}`);
};

// Função para notificar todos sobre atualização do lineup
export const notifyLineupUpdated = async (eventId: number): Promise<void> => {
  await api.post(`/admin/events/${eventId}/notify-lineup-updated`);
};

