import apiClient from './client';
import { Case } from '@/types/court';

interface GetJuryCasesResponse {
  ok: boolean;
  data: Case[];
}

export const juryService = {
  // Get cases where the user is a juror
  getJuryCases: async (userId: string): Promise<Case[]> => {
    const response = await apiClient.get<GetJuryCasesResponse>('/api/jury/cases', {
      params: { userId }
    });
    return response.data?.data || [];
  },

  // Submit jury vote
  submitVote: async (caseId: string, userId: string, vote: 'PLAINTIFF' | 'DEFENDANT'): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/jury/vote`, { userId, vote });
  }
};
