import api from "../auth/axiosConfig";
import axios from "axios";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

export interface ParadeLineupItemResponse {
  id: number;
  event_id: number;
  samba_school_id: number;
  performance_time: string; // Formato: HH:mm:ss
  performance_end_time?: string; // Formato: HH:mm:ss
  event_date?: string; // Formato: YYYY-MM-DD
  display_order: number;
  description?: string;
  created_at: string;
  created_by_id?: number;
  updated_at?: string;
  updated_by_id?: number;
  deleted_at?: string;
  deleted_by_id?: number;
  samba_school_name?: string;
  samba_school_image_url?: string;
}

export interface CreateParadeLineupItemData {
  event_id: number;
  samba_school_id: number;
  performance_time: string; // Formato: HH:mm
  performance_end_time?: string; // Formato: HH:mm
  event_date?: string; // Formato: YYYY-MM-DD
  display_order?: number;
  description?: string;
}

export interface UpdateParadeLineupItemData {
  samba_school_id?: number;
  performance_time?: string; // Formato: HH:mm
  performance_end_time?: string; // Formato: HH:mm
  event_date?: string; // Formato: YYYY-MM-DD
  display_order?: number;
  description?: string;
}

// Função pública para buscar lineup de desfile de um evento (sem autenticação)
export const getParadeLineupItemsByEvent = async (eventId: number): Promise<ParadeLineupItemResponse[]> => {
  const API_URL = getApiUrl();
  
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada");
  }
  
  const url = `${API_URL}/public/events/${eventId}/parade-lineup-items`;
  
  try {
    const response = await axios.get<ParadeLineupItemResponse[]>(url);
    return response.data;
  } catch (error: any) {
    console.error("Erro ao buscar lineup de desfile do evento:", error);
    throw error;
  }
};

// Função autenticada para buscar lineup de desfile (admin)
export const getParadeLineupItemsByEventAdmin = async (eventId: number): Promise<ParadeLineupItemResponse[]> => {
  const response = await api.get<ParadeLineupItemResponse[]>(`/admin/events/${eventId}/parade-lineup-items`);
  return response.data;
};

// Função para buscar um item específico do lineup de desfile
export const getParadeLineupItem = async (paradeLineupItemId: number): Promise<ParadeLineupItemResponse> => {
  const response = await api.get<ParadeLineupItemResponse>(`/admin/parade-lineup-items/${paradeLineupItemId}`);
  return response.data;
};

// Função para criar um item do lineup de desfile
export const createParadeLineupItem = async (data: CreateParadeLineupItemData): Promise<ParadeLineupItemResponse> => {
  const formData = new FormData();
  formData.append("event_id", data.event_id.toString());
  formData.append("samba_school_id", data.samba_school_id.toString());
  formData.append("performance_time", data.performance_time);
  if (data.performance_end_time !== undefined && data.performance_end_time !== null) {
    formData.append("performance_end_time", data.performance_end_time);
  }
  if (data.event_date !== undefined && data.event_date !== null) {
    formData.append("event_date", data.event_date);
  }
  if (data.display_order !== undefined) {
    formData.append("display_order", data.display_order.toString());
  }
  if (data.description !== undefined && data.description !== null) {
    formData.append("description", data.description);
  }

  const response = await api.post<ParadeLineupItemResponse>("/admin/parade-lineup-items", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Função para atualizar um item do lineup de desfile
export const updateParadeLineupItem = async (
  paradeLineupItemId: number,
  data: UpdateParadeLineupItemData
): Promise<ParadeLineupItemResponse> => {
  const formData = new FormData();
  
  if (data.samba_school_id !== undefined) {
    formData.append("samba_school_id", data.samba_school_id.toString());
  }
  if (data.performance_time !== undefined) {
    formData.append("performance_time", data.performance_time);
  }
  if (data.performance_end_time !== undefined) {
    formData.append("performance_end_time", data.performance_end_time || "");
  }
  if (data.event_date !== undefined) {
    formData.append("event_date", data.event_date || "");
  }
  if (data.display_order !== undefined) {
    formData.append("display_order", data.display_order.toString());
  }
  if (data.description !== undefined) {
    formData.append("description", data.description || "");
  }

  const response = await api.put<ParadeLineupItemResponse>(`/admin/parade-lineup-items/${paradeLineupItemId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Função para deletar um item do lineup de desfile
export const deleteParadeLineupItem = async (paradeLineupItemId: number): Promise<void> => {
  await api.delete(`/admin/parade-lineup-items/${paradeLineupItemId}`);
};

