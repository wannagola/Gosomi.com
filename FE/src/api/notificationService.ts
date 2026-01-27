import apiClient from './client';
import { Notification } from '@/types/user';

interface NotificationsResponse {
  ok: boolean;
  data: Notification[];
}

export const notificationService = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const response = await apiClient.get<NotificationsResponse>('/api/notifications', { params: { userId } });
    return response.data.data;
  },

  markRead: async (notificationId: string): Promise<void> => {
    await apiClient.post(`/api/notifications/${notificationId}/read`);
  }
};
