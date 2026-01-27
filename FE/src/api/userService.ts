import apiClient from './client';
import { User, Friend } from '@/types/user';

interface StatsResponse {
    ok: boolean;
    stats: {
        totalResolved: number;
        wins: number;
        losses: number;
        ties: number;
        winningRate: number;
    }
}

export const userService = {
  // Stats
  getUserStats: async (userId: string): Promise<StatsResponse['stats']> => {
    const response = await apiClient.get<StatsResponse>(`/api/cases/user/${userId}/stats`);
    return response.data.stats;
  },

  // Friends
  getFriends: async (userId: string): Promise<Friend[]> => {
    const response = await apiClient.get<{ ok: boolean; data: Friend[] }>(`/api/friends?userId=${userId}`);
    return response.data.data;
  },

  getFriendRequests: async (userId: string): Promise<Friend[]> => {
    const response = await apiClient.get<{ ok: boolean; data: Friend[] }>(`/api/friends/requests?userId=${userId}`);
    return response.data.data;
  },

  requestFriend: async (userId: string, friendId: string): Promise<void> => {
    await apiClient.post('/api/friends/request', { userId, friendId });
  },

  acceptFriendRequest: async (requestId: string): Promise<void> => {
    await apiClient.post('/api/friends/accept', { requestId });
  },

  deleteFriend: async (userId: string, friendId: string): Promise<void> => {
    await apiClient.delete('/api/friends', { data: { userId, friendId } });
  },

  // Search
  searchUsers: async (query: string, userId: string): Promise<User[]> => {
    const response = await apiClient.get<{ ok: boolean; data: User[] }>(`/api/friends/search?q=${encodeURIComponent(query)}&userId=${userId}`);
    return response.data.data;
  }
};
