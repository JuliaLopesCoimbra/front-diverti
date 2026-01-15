import api from "../auth/axiosConfig";
import { NewsResponse } from "../news/newsService";

export const getMyPosts = async (
  eventId?: number,
  limit = 10,
  offset = 0
): Promise<NewsResponse[]> => {
  const params: any = { limit, offset };
  if (eventId !== undefined) {
    params.event_id = eventId;
  }
  const response = await api.get("/admin/events/my-posts", { params });

  return response.data as NewsResponse[];
};

export const getMyPendingPosts = async (
  eventId?: number,
  limit = 10,
  offset = 0
): Promise<NewsResponse[]> => {
  const params: any = { limit, offset };
  if (eventId !== undefined) {
    params.event_id = eventId;
  }
  const response = await api.get("/admin/events/my-posts/pending", { params });

  return response.data as NewsResponse[];
};

