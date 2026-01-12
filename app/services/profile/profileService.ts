import api from "../auth/axiosConfig";

export interface ProfileResponse {
  id: number;
  name: string | null;
  email: string;
  profile_photo: string | null;
  role: string;
  is_email_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
}

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get<ProfileResponse>("/user/profile");
  return response.data;
};

export const updateProfilePhoto = async (photo: File): Promise<ProfileResponse> => {
  const formData = new FormData();
  formData.append("photo", photo);

  const response = await api.put<ProfileResponse>("/user/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

