import apiClient from './client';

export const juryService = {
  submitVote: async (caseId: string, userId: string, vote: 'PLAINTIFF' | 'DEFENDANT'): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/jury/vote`, { userId, vote });
  }
};
