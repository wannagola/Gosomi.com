import apiClient from './client';
import { User } from '@/types/user';

interface LoginResponse {
  ok: boolean;
  token: string;
  user: User;
}

export const authService = {
  login: async (userData: { kakaoId: string; nickname?: string; profileImage?: string }): Promise<{ token: string; user: User }> => {
    // Backend purely trusts this data now (as requested)
    const response = await apiClient.post<LoginResponse>('/api/auth/kakao', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    // Call backend logout if endpoint exists, otherwise just clear local
  }
};
