import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { RoomsService } from '../rooms/rooms.service';
import { JwtService } from '@nestjs/jwt';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // socketId -> { roomId, participantId, userId?, guestSessionId?, name, isOwner }
  private connectedSockets = new Map<string, {
    roomId: string;
    participantId: string;
    userId?: string;
    guestSessionId?: string;
    name: string;
    isOwner: boolean;
  }>();

  // roomId -> unix-ms timestamp from which (Date.now() - t) / 1000 gives current playback position
  private roomPlayStartTimes = new Map<string, number>();

  private getEstimatedTime(roomId: string, savedTime: number, isPlaying: boolean): number {
    if (!isPlaying) return savedTime;
    const startedAt = this.roomPlayStartTimes.get(roomId);
    if (startedAt === undefined) return savedTime;
    return (Date.now() - startedAt) / 1000;
  }

  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
    private roomsService: RoomsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    // Connection is lightweight; actual room join happens in 'room:join'
  }

  async handleDisconnect(client: Socket) {
    const info = this.connectedSockets.get(client.id);
    if (!info) return;

    this.connectedSockets.delete(client.id);

    // Clear socket from participant record
    try {
      await this.prisma.roomParticipant.update({
        where: { id: info.participantId },
        data: { socketId: null },
      });
    } catch (_) {}

    this.server.to(info.roomId).emit('room:user-left', {
      participantId: info.participantId,
      name: info.name,
    });
  }

  // ─── Join flow ───────────────────────────────────────────────────────────────

  @SubscribeMessage('room:join-request')
  async handleJoinRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { inviteCode: string; guestName?: string; token?: string },
  ) {
    try {
      const room = await this.prisma.room.findUnique({ where: { inviteCode: data.inviteCode } });
      if (!room) return client.emit('error', { message: 'Room not found' });

      let userId: string | undefined;
      let userName: string;

      // Resolve user identity
      if (data.token) {
        try {
          const payload = this.jwtService.verify(data.token);
          const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
          if (user) { userId = user.id; userName = user.name; }
        } catch (_) {}
      }

      if (!userId) {
        // Guest path
        userName = (data.guestName || 'Guest').trim().slice(0, 40);
      }

      // If owner is joining their own room
      if (userId && userId === room.ownerId) {
        let participant = await this.prisma.roomParticipant.findFirst({
          where: { roomId: room.id, userId },
        });
        if (!participant) {
          participant = await this.prisma.roomParticipant.create({
            data: { roomId: room.id, userId, role: 'OWNER', status: 'APPROVED' },
          });
        }
        await this.prisma.roomParticipant.update({
          where: { id: participant.id },
          data: { socketId: client.id },
        });

        this.connectedSockets.set(client.id, {
          roomId: room.id,
          participantId: participant.id,
          userId,
          name: userName,
          isOwner: true,
        });

        client.join(room.id);
        client.emit('room:user-approved', {
          roomId: room.id,
          participantId: participant.id,
          isOwner: true,
          room,
        });

        // Send current video state with estimated live position
        client.emit('video:sync', {
          currentTime: this.getEstimatedTime(room.id, room.currentTime, room.isPlaying),
          isPlaying: room.isPlaying,
          youtubeVideoId: room.youtubeVideoId,
        });

        const participants = await this.getApprovedParticipants(room.id);
        this.server.to(room.id).emit('room:participants-updated', participants);
        return;
      }

      // Check if already an approved participant (reconnect case)
      let existingParticipant: any = null;
      if (userId) {
        existingParticipant = await this.prisma.roomParticipant.findFirst({
          where: { roomId: room.id, userId, status: 'APPROVED' },
        });
      }

      if (existingParticipant) {
        await this.prisma.roomParticipant.update({
          where: { id: existingParticipant.id },
          data: { socketId: client.id },
        });
        this.connectedSockets.set(client.id, {
          roomId: room.id,
          participantId: existingParticipant.id,
          userId,
          name: userName,
          isOwner: false,
        });
        client.join(room.id);
        client.emit('room:user-approved', {
          roomId: room.id,
          participantId: existingParticipant.id,
          isOwner: false,
          room,
        });
        client.emit('video:sync', {
          currentTime: this.getEstimatedTime(room.id, room.currentTime, room.isPlaying),
          isPlaying: room.isPlaying,
          youtubeVideoId: room.youtubeVideoId,
        });
        const participants = await this.getApprovedParticipants(room.id);
        this.server.to(room.id).emit('room:participants-updated', participants);
        return;
      }

      // New join request
      const guestSessionId = userId ? undefined : nanoid();

      const joinRequest = await this.prisma.joinRequest.create({
        data: {
          roomId: room.id,
          userId,
          guestSessionId,
          guestName: userId ? undefined : userName,
          status: 'PENDING',
        },
      });

      // Store socket temporarily for tracking; not in a room yet
      client.data.pendingJoinRequest = {
        requestId: joinRequest.id,
        roomId: room.id,
        guestSessionId,
        userId,
        name: userName,
      };

      client.emit('room:join-pending', { requestId: joinRequest.id });

      // Notify owner
      this.server.to(room.id).emit('room:new-join-request', {
        requestId: joinRequest.id,
        name: userName,
        guestSessionId,
        userId,
      });
    } catch (err) {
      client.emit('error', { message: 'Failed to process join request' });
    }
  }

  @SubscribeMessage('room:approve-user')
  async handleApproveUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requestId: string },
  ) {
    const ownerInfo = this.connectedSockets.get(client.id);
    if (!ownerInfo?.isOwner) return client.emit('error', { message: 'Not authorized' });

    const request = await this.prisma.joinRequest.findUnique({ where: { id: data.requestId } });
    if (!request || request.roomId !== ownerInfo.roomId) return;

    await this.prisma.joinRequest.update({ where: { id: data.requestId }, data: { status: 'APPROVED' } });

    // Create participant record
    const participant = await this.prisma.roomParticipant.create({
      data: {
        roomId: request.roomId,
        userId: request.userId || undefined,
        guestSessionId: request.guestSessionId || undefined,
        guestName: request.guestName || undefined,
        role: 'PARTICIPANT',
        status: 'APPROVED',
      },
    });

    // Find the pending socket for this request
    const pendingSocket = this.findPendingSocket(data.requestId);
    if (pendingSocket) {
      const room = await this.prisma.room.findUnique({ where: { id: request.roomId } });
      const name = request.guestName || 'Participant';

      await this.prisma.roomParticipant.update({
        where: { id: participant.id },
        data: { socketId: pendingSocket.id },
      });

      this.connectedSockets.set(pendingSocket.id, {
        roomId: request.roomId,
        participantId: participant.id,
        userId: request.userId || undefined,
        guestSessionId: request.guestSessionId || undefined,
        name,
        isOwner: false,
      });

      pendingSocket.join(request.roomId);
      pendingSocket.emit('room:user-approved', {
        roomId: request.roomId,
        participantId: participant.id,
        isOwner: false,
        room,
      });
      pendingSocket.emit('video:sync', {
        currentTime: this.getEstimatedTime(request.roomId, room.currentTime, room.isPlaying),
        isPlaying: room.isPlaying,
        youtubeVideoId: room.youtubeVideoId,
      });

      const participants = await this.getApprovedParticipants(request.roomId);
      this.server.to(request.roomId).emit('room:participants-updated', participants);
    }
  }

  @SubscribeMessage('room:reject-user')
  async handleRejectUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requestId: string },
  ) {
    const ownerInfo = this.connectedSockets.get(client.id);
    if (!ownerInfo?.isOwner) return client.emit('error', { message: 'Not authorized' });

    const request = await this.prisma.joinRequest.findUnique({ where: { id: data.requestId } });
    if (!request || request.roomId !== ownerInfo.roomId) return;

    await this.prisma.joinRequest.update({ where: { id: data.requestId }, data: { status: 'REJECTED' } });

    const pendingSocket = this.findPendingSocket(data.requestId);
    if (pendingSocket) {
      pendingSocket.emit('room:user-rejected', { message: 'Your request to join was declined.' });
    }
  }

  // ─── Video controls (owner-only) ─────────────────────────────────────────────

  @SubscribeMessage('video:play')
  async handleVideoPlay(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { currentTime: number },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info?.isOwner) return;

    // Record the real-world moment this position corresponds to, so late joiners can estimate live position
    this.roomPlayStartTimes.set(info.roomId, Date.now() - data.currentTime * 1000);
    await this.roomsService.syncState(info.roomId, data.currentTime, true);
    client.to(info.roomId).emit('video:play', { currentTime: data.currentTime });
  }

  @SubscribeMessage('video:pause')
  async handleVideoPause(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { currentTime: number },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info?.isOwner) return;

    this.roomPlayStartTimes.delete(info.roomId);
    await this.roomsService.syncState(info.roomId, data.currentTime, false);
    client.to(info.roomId).emit('video:pause', { currentTime: data.currentTime });
  }

  @SubscribeMessage('video:seek')
  async handleVideoSeek(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { currentTime: number },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info?.isOwner) return;

    this.roomPlayStartTimes.delete(info.roomId);
    await this.roomsService.syncState(info.roomId, data.currentTime, false);
    client.to(info.roomId).emit('video:seek', { currentTime: data.currentTime });
  }

  @SubscribeMessage('video:change')
  async handleVideoChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { youtubeUrl: string; youtubeVideoId: string },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info?.isOwner) return;

    this.roomPlayStartTimes.delete(info.roomId);
    await this.prisma.room.update({
      where: { id: info.roomId },
      data: { youtubeUrl: data.youtubeUrl, youtubeVideoId: data.youtubeVideoId, currentTime: 0, isPlaying: false },
    });

    this.server.to(info.roomId).emit('video:change', { youtubeVideoId: data.youtubeVideoId });
  }

  @SubscribeMessage('video:request-sync')
  async handleSyncRequest(@ConnectedSocket() client: Socket) {
    const info = this.connectedSockets.get(client.id);
    if (!info) return;

    const room = await this.prisma.room.findUnique({ where: { id: info.roomId } });
    if (!room) return;

    client.emit('video:sync', {
      currentTime: this.getEstimatedTime(room.id, room.currentTime, room.isPlaying),
      isPlaying: room.isPlaying,
      youtubeVideoId: room.youtubeVideoId,
    });
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────────

  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info) return;

    const content = (data.content || '').trim().slice(0, 500);
    if (!content) return;

    const message = await this.chatService.createMessage({
      roomId: info.roomId,
      senderName: info.name,
      senderUserId: info.userId,
      guestSessionId: info.guestSessionId,
      content,
    });

    this.server.to(info.roomId).emit('chat:message', {
      ...message,
      isOwner: info.isOwner,
    });
  }

  @SubscribeMessage('chat:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info?.isOwner) return;

    const room = await this.prisma.room.findUnique({ where: { id: info.roomId } });
    await this.chatService.removeMessage(data.messageId, info.userId || info.name, room.ownerId);

    this.server.to(info.roomId).emit('chat:delete', { messageId: data.messageId });
  }

  // ─── Participant management ───────────────────────────────────────────────────

  @SubscribeMessage('participant:remove')
  async handleRemoveParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string },
  ) {
    const ownerInfo = this.connectedSockets.get(client.id);
    if (!ownerInfo?.isOwner) return;

    await this.prisma.roomParticipant.update({
      where: { id: data.participantId },
      data: { status: 'REMOVED' },
    });

    // Find the socket belonging to removed participant and disconnect them
    for (const [socketId, info] of this.connectedSockets.entries()) {
      if (info.participantId === data.participantId) {
        const targetSocket = this.server.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.emit('room:removed', { message: 'You were removed from this room by the owner.' });
          targetSocket.leave(info.roomId);
        }
        this.connectedSockets.delete(socketId);
        break;
      }
    }

    const participants = await this.getApprovedParticipants(ownerInfo.roomId);
    this.server.to(ownerInfo.roomId).emit('room:participants-updated', participants);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private findPendingSocket(requestId: string): Socket | null {
    for (const [socketId, _] of this.server.sockets.sockets) {
      const s = this.server.sockets.sockets.get(socketId);
      if (s?.data?.pendingJoinRequest?.requestId === requestId) return s;
    }
    return null;
  }

  private async getApprovedParticipants(roomId: string) {
    const participants = await this.prisma.roomParticipant.findMany({
      where: { roomId, status: 'APPROVED' },
      include: { user: { select: { id: true, name: true } } },
    });

    return participants.map((p) => ({
      id: p.id,
      name: p.user?.name || p.guestName || 'Guest',
      role: p.role,
      userId: p.userId,
      guestSessionId: p.guestSessionId,
      isOnline: !!p.socketId,
    }));
  }
}
