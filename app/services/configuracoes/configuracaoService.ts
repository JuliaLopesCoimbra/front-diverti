import api from '../auth/axiosConfig';

export interface PlataformaConfig {
  cpc: number;
  cpv: number;
  min_radius: number;
  min_duration: number;
  min_units: number;
  max_budget: number;
  new_sponsors: boolean;
  email_notifications: boolean;
  auto_approve: boolean;
  maintenance_mode: boolean;
}

export const getPlataformaConfig = async (): Promise<PlataformaConfig> => {
  const response = await api.get<PlataformaConfig>('/plataforma/config');
  return response.data;
};

export const updatePlataformaConfig = async (data: Partial<PlataformaConfig>): Promise<PlataformaConfig> => {
  const response = await api.put<PlataformaConfig>('/plataforma/config', data);
  return response.data;
};
