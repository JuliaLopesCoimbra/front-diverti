import api from "../auth/axiosConfig";

export interface AdClickStatsItem {
  ad_identifier: string;
  total_clicks: number;
  clicks_by_hour: Record<string, number>;
  clicks_by_event: Record<string, number>;
  first_click?: string | null;
  last_click?: string | null;
}

export interface AdClickStatsResponse {
  event_id?: number | null;
  event_name?: string | null;
  total_clicks: number;
  clicks_by_ad: AdClickStatsItem[];
  clicks_by_hour: Record<string, number>;
  period_start?: string | null;
  period_end?: string | null;
}

export interface AdViewStatsItem {
  ad_identifier: string;
  total_views: number;
  views_by_hour: Record<string, number>;
  views_by_event: Record<string, number>;
  first_view?: string | null;
  last_view?: string | null;
}

export interface AdViewStatsResponse {
  event_id?: number | null;
  event_name?: string | null;
  total_views: number;
  views_by_ad: AdViewStatsItem[];
  views_by_hour: Record<string, number>;
  period_start?: string | null;
  period_end?: string | null;
}

interface StatsParams {
  eventId?: number;
  adIdentifier?: string;
  startDate?: string;
  endDate?: string;
}

const buildParams = (params?: StatsParams) => ({
  event_id: params?.eventId,
  ad_identifier: params?.adIdentifier,
  start_date: params?.startDate,
  end_date: params?.endDate,
});

export async function getAdClickStats(
  params?: StatsParams
): Promise<AdClickStatsResponse> {
  const response = await api.get<AdClickStatsResponse>("/ads/stats", {
    params: buildParams(params),
  });

  return response.data;
}

export async function getAdViewStats(
  params?: StatsParams
): Promise<AdViewStatsResponse> {
  const response = await api.get<AdViewStatsResponse>("/ads/views/stats", {
    params: buildParams(params),
  });

  return response.data;
}
