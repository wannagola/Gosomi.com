import apiClient from './client';
import { User } from '@/types/user';

interface LoginResponse {
  ok: boolean;
  token: string;
  user: User;
}

export const authService = {
  login: async (code: string): Promise<{ token: string; user: User }> => {
    // Backend needs to know which redirect_uri was used to generate the code
    const redirectUri = window.location.origin + '/login'; 
    const response = await apiClient.post<LoginResponse>('/api/auth/kakao', { code, redirectUri });
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    // Call backend logout if endpoint exists, otherwise just clear local
  }
};
