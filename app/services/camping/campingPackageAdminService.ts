import api from "../auth/axiosConfig";

export interface CampingPackage {
  id: number;
  event_id: number;
  label: string;
  badge?: string | null;
  badge_color?: string | null;
  price_cents: number;
  price_label?: string | null;
  period?: string | null;
  days?: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string | null;
}

export interface CampingPackageCreate {
  event_id: number;
  label: string;
  badge?: string;
  badge_color?: string;
  price_cents: number;
  price_label?: string;
  period?: string;
  days?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface CampingPackageUpdate {
  label?: string;
  badge?: string;
  badge_color?: string;
  price_cents?: number;
  price_label?: string;
  period?: string;
  days?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export const getEventCampingPackages = async (eventId: number): Promise<CampingPackage[]> => {
  const res = await api.get<CampingPackage[]>(`/admin/events/${eventId}/camping-packages`);
  return res.data;
};

export const createCampingPackage = async (data: CampingPackageCreate): Promise<CampingPackage> => {
  const res = await api.post<CampingPackage>("/admin/camping-packages", data);
  return res.data;
};

export const updateCampingPackage = async (id: number, data: CampingPackageUpdate): Promise<CampingPackage> => {
  const res = await api.put<CampingPackage>(`/admin/camping-packages/${id}`, data);
  return res.data;
};

export const deleteCampingPackage = async (id: number): Promise<void> => {
  await api.delete(`/admin/camping-packages/${id}`);
};

export const formatPriceCents = (cents: number): string => {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const parsePriceInput = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(parseFloat(cleaned || "0") * 100);
};
