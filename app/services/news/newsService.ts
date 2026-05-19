import api from "../auth/axiosConfig";

export interface NewsImage {
  id: number;
  image_url: string;
  image_order: number;
}

export interface NewsResponse {
  id: number;
  title: string;
  content: string;
  images: NewsImage[];
  created_at: string;
  approved_at?: string;
  deleted_at?: string;
  deleted_by_id?: number;
  event_id?: number;
  status?: "pending" | "approved" | "rejected" | "deleted";
  author?: NewsAuthor | null;
}

export interface NewsAuthor {
  id: number;
  name: string;
  profile_photo?: string;
}

export interface NewsComment {
  id: number;
  content: string;
  created_at: string;
  parent_comment_id?: number | null;
  deleted_at?: string | null;
  deleted_by_user_id?: number | null;
  likes: {
    count: number;
    user_liked: boolean;
  };
  replies_count: number;
  user: {
    id: number;
    name: string;
    profile_photo?: string;
  };
}

export interface NewsLikes {
  count: number;
  user_liked: boolean;
}

export interface NewsDetailsResponse {
  id: number;
  title: string;
  content: string;
  images: NewsImage[];
  event_id: number;
  status?: "pending" | "approved" | "rejected" | "deleted";
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  approved_by_id?: number;
  deleted_at?: string;
  deleted_by_id?: number;
  author: NewsAuthor | null;
  likes: NewsLikes;
  comments: NewsComment[];
  comments_count: number;
}

export const getEventNews = async (
  eventId: number,
  limit = 10,
  offset = 0
): Promise<NewsResponse[]> => {
  const response = await api.get(
    `/admin/events/${eventId}/news`,
    {
      params: { limit, offset },
    }
  );

  return response.data as NewsResponse[];
};

export const getNewsDetails = async (
  newsId: number,
  eventId?: number
): Promise<NewsDetailsResponse> => {
  const params = eventId ? { event_id: eventId } : {};
  const response = await api.get(`/news/${newsId}/details`, { params });
  return response.data as NewsDetailsResponse;
};

export const likeNews = async (newsId: number) => {
  const response = await api.post(`/news/${newsId}/likes`);
  return response.data;
};

export const unlikeNews = async (newsId: number) => {
  const response = await api.delete(`/news/${newsId}/likes`);
  return response.data;
};

export const createComment = async (
  newsId: number,
  content: string
): Promise<NewsComment> => {
  const response = await api.post(`/news/${newsId}/comments`, null, {
    params: { content },
  });
  return response.data as NewsComment;
};

export interface CreateNewsRequest {
  title: string;
  content: string;
  images: File[];  // Agora aceita múltiplas imagens
  event_id: number;
}

export interface UpdateNewsRequest {
  title: string;
  content: string;
  images?: File[];
  replace_all?: boolean;
}

export const createNews = async (
  eventId: number,
  data: CreateNewsRequest
): Promise<NewsResponse> => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  
  // Adiciona todas as imagens
  data.images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await api.post(
    `/admin/events/${eventId}/news`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data as NewsResponse;
};

export const updateNews = async (
  eventId: number,
  newsId: number,
  data: UpdateNewsRequest
): Promise<NewsResponse> => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  formData.append("replace_all", data.replace_all ? "true" : "false");
  
  // Adiciona todas as imagens
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append("images", image);
    });
  }

  const response = await api.put(
    `/admin/events/${eventId}/news/${newsId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data as NewsResponse;
};

export const deleteNews = async (
  eventId: number,
  newsId: number
): Promise<void> => {
  await api.delete(`/admin/events/${eventId}/news/${newsId}`);
};

// Endpoints para posts pendentes
export const getPendingPosts = async (eventId?: number): Promise<NewsResponse[]> => {
  const params = eventId ? { event_id: eventId } : {};
  const response = await api.get("/admin/events/news/pending", { params, _background: true } as any);
  return response.data as NewsResponse[];
};

export const approvePost = async (postId: number): Promise<void> => {
  await api.post(`/admin/events/news/${postId}/approve`);
};

export const rejectPost = async (postId: number): Promise<void> => {
  await api.post(`/admin/events/news/${postId}/reject`);
};

export const deactivatePost = async (postId: number): Promise<void> => {
  await api.post(`/admin/events/news/${postId}/deactivate`);
};
