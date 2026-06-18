import api from '../auth/axiosConfig';

export interface CampaignPayload {
  campaign_name: string;
  ad_type: 'CPC' | 'CPV';
  creative_url?: string;
  creative_name?: string;
  redirect_url?: string;
  event_id?: number;
  target_units?: number;
  budget_type?: 'diario' | 'total';
  budget_value?: number;
  start_at?: string;
  duration_days?: number;
  hobbies?: string[];
  professions?: string[];
  gender?: string;
  age_min?: number;
  age_max?: number;
  address?: string;
  radius_km?: number;
  location_lat?: number;
  location_lng?: number;
}

export interface Campaign {
  id: number;
  patrocinador_id: number;
  campaign_name: string;
  ad_type: string;
  creative_url: string | null;
  creative_name: string | null;
  redirect_url: string | null;
  event_id: number | null;
  target_units: number;
  budget_type: string;
  budget_value: number;
  start_at: string | null;
  duration_days: number | null;
  hobbies: string[];
  professions: string[];
  gender: string | null;
  age_min: number | null;
  age_max: number | null;
  address: string | null;
  radius_km: number | null;
  location_lat: number | null;
  location_lng: number | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface PatrocinadorWithCampaigns {
  patrocinador_id: number;
  patrocinador_name: string | null;
  patrocinador_email: string;
  campaigns: Campaign[];
}

const handleError = (error: unknown, fallback: string): never => {
  const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || fallback);
};

export const createCampaign = async (data: CampaignPayload): Promise<Campaign> => {
  try {
    const response = await api.post<Campaign>('/campaigns', data);
    return response.data;
  } catch (error) {
    handleError(error, 'Erro ao criar campanha');
    throw error;
  }
};

export const listMyCampaigns = async (limit = 50, offset = 0): Promise<Campaign[]> => {
  try {
    const response = await api.get<Campaign[]>('/campaigns/my', { params: { limit, offset } });
    return response.data;
  } catch (error) {
    handleError(error, 'Erro ao listar campanhas');
    throw error;
  }
};

export const uploadCreative = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/campaigns/upload-creative', formData);
    return response.data.url;
  } catch (error) {
    handleError(error, 'Erro ao fazer upload do criativo');
    throw error;
  }
};

export const listAllCampaignsGrouped = async (): Promise<PatrocinadorWithCampaigns[]> => {
  try {
    const response = await api.get<PatrocinadorWithCampaigns[]>('/campaigns/all');
    return response.data;
  } catch (error) {
    handleError(error, 'Erro ao listar campanhas');
    throw error;
  }
};
