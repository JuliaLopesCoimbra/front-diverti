import api from "../auth/axiosConfig";

export interface RelatedUser {
  id: number;
  name: string;
  profile_photo?: string;
}

export interface Notification {
  id: number;
  type: "comment_reply" | "comment_like" | "post_like" | "post_approved" | "post_approved_admin" | "post_rejected" | "post_deactivated" | "new_post" | "lineup_updated" | "post_comment" | "new_event" | "admin_broadcast";
  title: string;
  message: string;
  related_user_id?: number;
  related_user?: RelatedUser;
  related_news_id?: number;
  related_comment_id?: number;
  related_event_id?: number;
  broadcast_sender_id?: number;
  broadcast_sender?: RelatedUser;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export const getNotifications = async (
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<NotificationResponse> => {
  const response = await api.get<NotificationResponse>("/notifications", {
    params: { limit, offset, unread_only: unreadOnly },
  });
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<UnreadCountResponse>("/notifications/unread/count", {
    _background: true,
  } as any);
  return response.data.unread_count;
};

export const markAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
}

export interface BroadcastNotificationResponse {
  message: string;
  users_notified: number;
}

export const broadcastNotification = async (
  data: BroadcastNotificationRequest
): Promise<BroadcastNotificationResponse> => {
  const response = await api.post<BroadcastNotificationResponse>(
    "/notifications/broadcast",
    data
  );
  return response.data;
};

