export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  ownerId: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  currentTime: number;
  isPlaying: boolean;
  createdAt: string;
  owner?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Participant {
  id: string;
  name: string;
  role: 'OWNER' | 'PARTICIPANT';
  userId?: string;
  guestSessionId?: string;
  isOnline: boolean;
}

export interface JoinRequest {
  requestId: string;
  name: string;
  guestSessionId?: string;
  userId?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderName: string;
  senderUserId?: string;
  guestSessionId?: string;
  content: string;
  isRemoved: boolean;
  removedBy?: string;
  removedAt?: string;
  createdAt: string;
  isOwner?: boolean;
}

export interface VideoState {
  currentTime: number;
  isPlaying: boolean;
  youtubeVideoId: string;
}

export type RoomUserStatus = 'idle' | 'pending' | 'approved' | 'rejected' | 'removed';
