import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  async remove(roomId: string, participantId: string, requesterId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== requesterId) throw new ForbiddenException('Only owner can remove participants');

    return this.prisma.roomParticipant.update({
      where: { id: participantId },
      data: { status: 'REMOVED' },
    });
  }

  async findParticipantBySocket(socketId: string) {
    return this.prisma.roomParticipant.findFirst({
      where: { socketId },
      include: { room: true },
    });
  }

  async updateSocket(participantId: string, socketId: string | null) {
    return this.prisma.roomParticipant.update({
      where: { id: participantId },
      data: { socketId },
    });
  }
}
