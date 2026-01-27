import apiClient from './client';
import { Case, Evidence } from '@/types/court';

interface GetCasesResponse {
  ok: boolean;
  data: Case[];
}

interface CreateCaseResponse {
  ok: boolean;
  caseId: string;
  caseNumber: string;
}

export const caseService = {
  // Get all cases (with filters)
  getCases: async (params?: { q?: string; userId?: string; status?: string }): Promise<Case[]> => {
    const response = await apiClient.get<GetCasesResponse>('/api/cases', { params });
    // Transform backend data to frontend Case model if necessary
    // for now assuming direct mapping or we might need adapters
    return response.data?.data || [];
  },

  // Get single case
  getCase: async (id: string): Promise<Case> => {
    const response = await apiClient.get<Case>(`/api/cases/${id}`);
    return response.data;
  },

  // Create case
  createCase: async (data: {
    title: string;
    content: string;
    plaintiffId: string | number;
    defendantId: string | number;
    juryEnabled: boolean;
    juryMode: 'RANDOM' | 'INVITE';
    juryInvitedUserIds?: (string | number)[];
    lawType?: string; // Add lawType if needed by frontend even if not in spec example body (spec might infer from context)
  }): Promise<CreateCaseResponse> => {
    const response = await apiClient.post<CreateCaseResponse>('/api/cases', data);
    return response.data;
  },

  // Upload Evidence
  uploadEvidence: async (caseId: string, userId: string, files: FileList): Promise<void> => {
    const formData = new FormData();
    formData.append('caseId', caseId);
    formData.append('userId', userId);
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    await apiClient.post('/api/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Submit Defense
  submitDefense: async (caseId: string, content: string): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/defense`, { content });
  },

  // AI Verdict
  requestVerdict: async (caseId: string): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/verdict`);
  },

  // Select Penalty
  selectPenalty: async (caseId: string, choice: 'SERIOUS' | 'FUNNY'): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/penalty`, { choice });
  },

  // Appeal
  submitAppeal: async (caseId: string, appellantId: string, reason: string): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/appeal`, { appellantId, reason });
  },

  // Appeal Defense
  submitAppealDefense: async (caseId: string, content: string): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/appeal/defense`, { content });
  },

  // Appeal Verdict
  requestAppealVerdict: async (caseId: string): Promise<void> => {
    await apiClient.post(`/api/cases/${caseId}/appeal/verdict`);
  }
};
