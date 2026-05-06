import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async createMessage(data: {
    roomId: string;
    senderName: string;
    senderUserId?: string;
    guestSessionId?: string;
    content: string;
  }) {
    return this.prisma.message.create({ data });
  }

  async removeMessage(messageId: string, removedBy: string, roomOwnerId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');

    const room = await this.prisma.room.findUnique({ where: { id: msg.roomId } });
    if (room.ownerId !== roomOwnerId) throw new ForbiddenException('Only the room owner can delete messages');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRemoved: true, removedBy, removedAt: new Date() },
    });
  }
}
