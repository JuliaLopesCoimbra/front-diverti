import api from "../auth/axiosConfig";
import { NewsDetailsResponse } from "../news/newsService";

export interface LikeCountResponse {
  count: number;
}

export interface LikeStatusResponse {
  liked: boolean;
}

/**
 * Curtir uma notícia
 */
export const likeNews = async (newsId: number): Promise<void> => {
  await api.post(`/news/${newsId}/likes`);
};

/**
 * Descurtir uma notícia
 */
export const unlikeNews = async (newsId: number): Promise<void> => {
  await api.delete(`/news/${newsId}/likes`);
};

/**
 * Obter contagem de curtidas de uma notícia
 */
export const getLikesCount = async (
  newsId: number
): Promise<LikeCountResponse> => {
  const response = await api.get(`/news/${newsId}/likes/count`);
  return response.data as LikeCountResponse;
};

/**
 * Verificar se o usuário atual curtiu a notícia
 */
export const didILike = async (
  newsId: number
): Promise<LikeStatusResponse> => {
  const response = await api.get(`/news/${newsId}/likes/me`);
  return response.data as LikeStatusResponse;
};

/**
 * Listar todos os posts que o usuário curtiu
 */
export const getLikedPosts = async (
  eventId?: number,
  limit: number = 10,
  offset: number = 0
): Promise<NewsDetailsResponse[]> => {
  const params: any = { limit, offset };
  if (eventId !== undefined) {
    params.event_id = eventId;
  }
  const response = await api.get(`/news/likes/me`, { params });
  return response.data as NewsDetailsResponse[];
};

