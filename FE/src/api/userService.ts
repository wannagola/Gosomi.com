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

  // Search (Optional, if needed for adding friends)
  searchUsers: async (query: string): Promise<User[]> => {
    // Assuming an endpoint exists or we use getting friends as a proxy if no dedicated search
    // Using a hypothetical endpoint based on common patterns, though not explicitly in the summary list above for 'Search'.
    // The spec mentions "Search List" for Cases, but for users it implies friend requests.
    // If no search user endpoint, we might skip this or implement if backend supports.
    // Spec doesn't strictly define user search, only friend list. 
    // We'll leave it empty or comment it out if not strictly defined.
    return []; 
  }
};
