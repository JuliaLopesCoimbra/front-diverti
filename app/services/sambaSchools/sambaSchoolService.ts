import api from "../auth/axiosConfig";

export interface SambaSchoolResponse {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  event_id: number;
  created_at: string;
  deleted_at?: string;
  deleted_by_id?: number;
}

export interface CreateSambaSchoolData {
  name: string;
  description?: string;
  image?: File;
}

export interface UpdateSambaSchoolData {
  name: string;
  description?: string;
  image?: File;
}

export const getSambaSchoolsByEvent = async (
  eventId: number
): Promise<SambaSchoolResponse[]> => {
  const response = await api.get<SambaSchoolResponse[]>(
    `/admin/events/${eventId}/samba-schools`
  );
  return response.data;
};

export const createSambaSchool = async (
  eventId: number,
  data: CreateSambaSchoolData
): Promise<SambaSchoolResponse> => {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.image) formData.append("image", data.image);

  const response = await api.post<SambaSchoolResponse>(
    `/admin/events/${eventId}/samba-schools`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getSambaSchoolById = async (
  eventId: number,
  schoolId: number
): Promise<SambaSchoolResponse> => {
  const response = await api.get<SambaSchoolResponse>(
    `/admin/events/${eventId}/samba-schools/${schoolId}`
  );
  return response.data;
};

export const updateSambaSchool = async (
  eventId: number,
  schoolId: number,
  data: UpdateSambaSchoolData
): Promise<SambaSchoolResponse> => {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.image) formData.append("image", data.image);

  const response = await api.put<SambaSchoolResponse>(
    `/admin/events/${eventId}/samba-schools/${schoolId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteSambaSchool = async (
  eventId: number,
  schoolId: number
): Promise<void> => {
  await api.delete(`/admin/events/${eventId}/samba-schools/${schoolId}`);
};
