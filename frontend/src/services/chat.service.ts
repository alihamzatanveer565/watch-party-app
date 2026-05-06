import api from '@/lib/axios';
import { ChatMessage } from '@/types';

export const chatService = {
  async getMessages(roomId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/chat/${roomId}/messages`);
    return data;
  },
};
