import api from "../auth/axiosConfig";


export interface EventResponse {
  id: number;
  title: string;
  description: string;
  location?: string;
  banner_image?: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  is_active: boolean;
  event_dates?: string; // Campo opcional para múltiplas datas (formato: "2024-01-09,2024-01-10,2024-01-20,2024-01-21" ou "09,10,20,21 de janeiro")
}

export interface CreateEventData {
  title: string;
  description?: string;
  location?: string;
  starts_at?: string;
  ends_at?: string;
  event_dates?: string; // Formato: "2024-01-09,2024-01-10,2024-01-20,2024-01-21"
  banner_image?: File;
}

export interface UpdateEventData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  event_dates?: string; // Formato: "2024-01-09,2024-01-10,2024-01-20,2024-01-21"
  banner_image?: File;
}

export const getEvents = async (): Promise<EventResponse[]> => {
  const response = await api.get<EventResponse[]>("/admin/events");
  return response.data;
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
