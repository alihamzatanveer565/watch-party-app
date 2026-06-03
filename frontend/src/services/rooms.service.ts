import api from '@/lib/axios';
import { Room, PublicRoomCard, RoomVisibility } from '@/types';

export const roomsService = {
  async create(name: string, youtubeUrl: string, description?: string, visibility?: RoomVisibility): Promise<Room> {
    const { data } = await api.post<Room>('/rooms', { name, youtubeUrl, description, visibility });
    return data;
  },

  async getByInviteCode(inviteCode: string): Promise<Room> {
    const { data } = await api.get<Room>(`/rooms/invite/${inviteCode}`);
    return data;
  },

  async getById(id: string): Promise<Room> {
    const { data } = await api.get<Room>(`/rooms/${id}`);
    return data;
  },

  async getMyRooms(): Promise<Room[]> {
    const { data } = await api.get<Room[]>('/rooms/my');
    return data;
  },

  async updateVideo(roomId: string, youtubeUrl: string): Promise<Room> {
    const { data } = await api.patch<Room>(`/rooms/${roomId}/video`, { youtubeUrl });
    return data;
  },

  async getPublicRooms(): Promise<PublicRoomCard[]> {
    const { data } = await api.get<PublicRoomCard[]>('/rooms/public');
    return data;
  },

  async updateVisibility(roomId: string, visibility: RoomVisibility): Promise<Room> {
    const { data } = await api.patch<Room>(`/rooms/${roomId}/visibility`, { visibility });
    return data;
  },
};
