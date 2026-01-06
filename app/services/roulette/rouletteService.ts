import api from "../auth/axiosConfig";

export interface RouletteResponse {
  id: number;
  name: string;
  event_id: number;
  is_active: boolean;
  roulette_image_url: string;
  pointer_image_url: string;
  expires_at?: string | null;
}

export interface SpinResponse {
  spin_id: number;
  event_id: number;
  prize: {
    id: number;
    name: string;
    image_url?: string;
    position: number;
  };
}

export const getRouletteByEvent = async (
  eventId: number
): Promise<RouletteResponse> => {
  const res = await api.get<RouletteResponse>(
    `/roulette/events/${eventId}`
  );

  return res.data;
};

export const spinRoulette = async (
  eventId: number
): Promise<SpinResponse> => {
  const res = await api.post<SpinResponse>(
    `/roulette/events/${eventId}/spin`
  );

  return res.data;
};

