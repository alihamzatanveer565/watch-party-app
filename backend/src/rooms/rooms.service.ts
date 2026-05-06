import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateVideoDto } from './dto/room.dto';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

function extractYoutubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  throw new BadRequestException('Invalid YouTube URL');
}

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateRoomDto) {
    const videoId = extractYoutubeId(dto.youtubeUrl);
    const inviteCode = nanoid();

    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        description: dto.description,
        inviteCode,
        ownerId,
        youtubeUrl: dto.youtubeUrl,
        youtubeVideoId: videoId,
      },
    });

    // Add owner as approved participant
    await this.prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: ownerId,
        role: 'OWNER',
        status: 'APPROVED',
      },
    });

    return room;
  }

  async findByInviteCode(inviteCode: string) {
    const room = await this.prisma.room.findUnique({
      where: { inviteCode },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async findById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getMyRooms(userId: string) {
    return this.prisma.room.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVideo(roomId: string, ownerId: string, dto: UpdateVideoDto) {
    const room = await this.findById(roomId);
    if (room.ownerId !== ownerId) throw new ForbiddenException();

    const videoId = extractYoutubeId(dto.youtubeUrl);
    return this.prisma.room.update({
      where: { id: roomId },
      data: { youtubeUrl: dto.youtubeUrl, youtubeVideoId: videoId, currentTime: 0, isPlaying: false },
    });
  }

  async syncState(roomId: string, currentTime: number, isPlaying: boolean) {
    return this.prisma.room.update({
      where: { id: roomId },
      data: { currentTime, isPlaying },
    });
  }

  async getParticipants(roomId: string) {
    return this.prisma.roomParticipant.findMany({
      where: { roomId, status: 'APPROVED' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getPendingRequests(roomId: string) {
    return this.prisma.joinRequest.findMany({
      where: { roomId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }
}
