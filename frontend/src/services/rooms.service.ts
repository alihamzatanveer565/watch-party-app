import api from '@/lib/axios';
import { Room } from '@/types';

export const roomsService = {
  async create(name: string, youtubeUrl: string, description?: string): Promise<Room> {
    const { data } = await api.post<Room>('/rooms', { name, youtubeUrl, description });
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
};
