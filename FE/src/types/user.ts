export interface User {
  id: string;
  nickname: string;
  profileImage?: string;
  winRate?: number;
}

export type FriendStatus = 'pending' | 'friend' | 'blocked';

export interface Friend extends User {
  status?: FriendStatus;
  requestedAt?: Date; // When the request was sent/received
}

export interface Notification {
  id: string;
  type: 'SUMMON' | 'VERDICT' | 'APPEAL' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT';
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  caseId?: string;
}
