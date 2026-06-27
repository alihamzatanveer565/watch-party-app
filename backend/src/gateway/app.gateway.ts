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

  // roomId -> timer: 2-min grace period before host migration
  private hostGraceTimers = new Map<string, NodeJS.Timeout>();

  // roomId -> timer: 30-min before room is considered stale
  private emptyRoomTimers = new Map<string, NodeJS.Timeout>();

  // roomId -> debounce timer for participant list broadcasts
  // Collapses rapid joins (e.g. 100 users joining at once) into a single DB query + broadcast
  private participantUpdateTimers = new Map<string, NodeJS.Timeout>();

  private scheduleParticipantsUpdate(roomId: string) {
    const existing = this.participantUpdateTimers.get(roomId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      this.participantUpdateTimers.delete(roomId);
      const participants = await this.getApprovedParticipants(roomId);
      this.server.to(roomId).emit('room:participants-updated', participants);
    }, 150);
    this.participantUpdateTimers.set(roomId, timer);
  }

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

    if (info.isOwner) {
      // Pause video immediately and save estimated position
      const room = await this.prisma.room.findUnique({ where: { id: info.roomId } });
      if (room) {
        const estimatedTime = this.getEstimatedTime(room.id, room.currentTime, room.isPlaying);
        this.roomPlayStartTimes.delete(info.roomId);
        await this.roomsService.syncState(info.roomId, estimatedTime, false);
        this.server.to(info.roomId).emit('video:pause', { currentTime: estimatedTime });
      }

      // Notify room and start 2-min grace period for host to reconnect
      this.server.to(info.roomId).emit('room:host-disconnected', { gracePeriodSeconds: 120 });

      const existing = this.hostGraceTimers.get(info.roomId);
      if (existing) clearTimeout(existing);

      const graceTimer = setTimeout(() => {
        this.hostGraceTimers.delete(info.roomId);
        this.migrateHost(info.roomId);
      }, 120_000);
      this.hostGraceTimers.set(info.roomId, graceTimer);
    }

    // If room is now empty, start 30-min stale timer
    if (this.getOnlineCountForRoom(info.roomId) === 0) {
      this.startEmptyRoomTimer(info.roomId);
    }
  }

  private getOnlineCountForRoom(roomId: string): number {
    let count = 0;
    for (const info of this.connectedSockets.values()) {
      if (info.roomId === roomId) count++;
    }
    return count;
  }

  private startEmptyRoomTimer(roomId: string) {
    const existing = this.emptyRoomTimers.get(roomId);
    if (existing) clearTimeout(existing);
    // After 30 min empty the room is stale — findPublicRooms already filters by online count,
    // so no DB action needed; timer just cleans up the map entry.
    const timer = setTimeout(() => {
      this.emptyRoomTimers.delete(roomId);
    }, 30 * 60 * 1000);
    this.emptyRoomTimers.set(roomId, timer);
  }

  private async migrateHost(roomId: string) {
    // Collect sockets still in this room
    const onlineSocketIds: string[] = [];
    for (const [socketId, info] of this.connectedSockets.entries()) {
      if (info.roomId === roomId && !info.isOwner) onlineSocketIds.push(socketId);
    }

    if (onlineSocketIds.length === 0) {
      this.startEmptyRoomTimer(roomId);
      return;
    }

    // Promote the longest-joined online participant
    const candidate = await this.prisma.roomParticipant.findFirst({
      where: { roomId, status: 'APPROVED', socketId: { in: onlineSocketIds } },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!candidate || !candidate.socketId) {
      this.startEmptyRoomTimer(roomId);
      return;
    }

    await this.prisma.roomParticipant.update({
      where: { id: candidate.id },
      data: { role: 'OWNER' },
    });

    // Update DB ownerId only for registered users
    if (candidate.userId) {
      await this.prisma.room.update({
        where: { id: roomId },
        data: { ownerId: candidate.userId },
      });
    }

    // Elevate in-memory socket entry
    const socketInfo = this.connectedSockets.get(candidate.socketId);
    if (socketInfo) {
      this.connectedSockets.set(candidate.socketId, { ...socketInfo, isOwner: true });
    }

    const newOwnerName = candidate.user?.name || candidate.guestName || 'Participant';

    this.server.to(roomId).emit('room:host-changed', {
      newOwnerId: candidate.userId || candidate.guestSessionId,
      newOwnerName,
      participantId: candidate.id,
    });

    // Tell the new host directly
    const newHostSocket = this.server.sockets.sockets.get(candidate.socketId);
    newHostSocket?.emit('room:you-are-host', {});
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

        // Cancel grace period if owner reconnected in time
        const graceTimer = this.hostGraceTimers.get(room.id);
        if (graceTimer) {
          clearTimeout(graceTimer);
          this.hostGraceTimers.delete(room.id);
          this.server.to(room.id).emit('room:host-reconnected', { ownerName: userName });
        }

        // Cancel empty room stale timer
        const emptyTimer = this.emptyRoomTimers.get(room.id);
        if (emptyTimer) {
          clearTimeout(emptyTimer);
          this.emptyRoomTimers.delete(room.id);
        }

        client.join(room.id);
        client.emit('room:user-approved', {
          roomId: room.id,
          participantId: participant.id,
          isOwner: true,
          room,
        });

        client.emit('video:sync', {
          currentTime: this.getEstimatedTime(room.id, room.currentTime, room.isPlaying),
          isPlaying: room.isPlaying,
          youtubeVideoId: room.youtubeVideoId,
        });

        this.scheduleParticipantsUpdate(room.id);
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
        const isOwner = existingParticipant.role === 'OWNER' || userId === room.ownerId;
        await this.prisma.roomParticipant.update({
          where: { id: existingParticipant.id },
          data: { socketId: client.id },
        });
        this.connectedSockets.set(client.id, {
          roomId: room.id,
          participantId: existingParticipant.id,
          userId,
          name: userName,
          isOwner,
        });

        const emptyTimer = this.emptyRoomTimers.get(room.id);
        if (emptyTimer) { clearTimeout(emptyTimer); this.emptyRoomTimers.delete(room.id); }

        client.join(room.id);
        client.emit('room:user-approved', {
          roomId: room.id,
          participantId: existingParticipant.id,
          isOwner,
          room,
        });
        client.emit('video:sync', {
          currentTime: this.getEstimatedTime(room.id, room.currentTime, room.isPlaying),
          isPlaying: room.isPlaying,
          youtubeVideoId: room.youtubeVideoId,
        });
        this.scheduleParticipantsUpdate(room.id);
        return;
      }

      // New join — determine identity
      const guestSessionId = userId ? undefined : nanoid();

      // Auto-approve for PUBLIC and UNLISTED rooms
      if (room.visibility === 'PUBLIC' || room.visibility === 'UNLISTED') {
        const participant = await this.prisma.roomParticipant.create({
          data: {
            roomId: room.id,
            userId: userId ?? undefined,
            guestSessionId: guestSessionId ?? undefined,
            guestName: userId ? undefined : userName,
            role: 'PARTICIPANT',
            status: 'APPROVED',
            socketId: client.id,
          },
        });
        this.connectedSockets.set(client.id, {
          roomId: room.id,
          participantId: participant.id,
          userId,
          guestSessionId,
          name: userName,
          isOwner: false,
        });

        const emptyTimer = this.emptyRoomTimers.get(room.id);
        if (emptyTimer) { clearTimeout(emptyTimer); this.emptyRoomTimers.delete(room.id); }

        client.join(room.id);
        client.emit('room:user-approved', {
          roomId: room.id,
          participantId: participant.id,
          isOwner: false,
          room,
        });
        client.emit('video:sync', {
          currentTime: this.getEstimatedTime(room.id, room.currentTime, room.isPlaying),
          isPlaying: room.isPlaying,
          youtubeVideoId: room.youtubeVideoId,
        });
        this.scheduleParticipantsUpdate(room.id);
        return;
      }

      // PRIVATE room — join request queue (host approval required)
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

      this.emitJoinRequestToOwners(room.id, {
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

      this.scheduleParticipantsUpdate(request.roomId);
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

  // ─── Room settings ───────────────────────────────────────────────────────────

  @SubscribeMessage('room:visibility-changed')
  async handleVisibilityChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { visibility: string },
  ) {
    const info = this.connectedSockets.get(client.id);
    if (!info?.isOwner) return;
    this.server.to(info.roomId).emit('room:visibility-changed', { visibility: data.visibility });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Notify room owners — direct socket emit survives reconnect/proxy edge cases. */
  private emitJoinRequestToOwners(
    roomId: string,
    payload: { requestId: string; name: string; guestSessionId?: string; userId?: string },
  ) {
    let notified = false;
    for (const [socketId, info] of this.connectedSockets.entries()) {
      if (info.roomId === roomId && info.isOwner) {
        this.server.sockets.sockets.get(socketId)?.emit('room:new-join-request', payload);
        notified = true;
      }
    }
    if (!notified) {
      this.server.to(roomId).emit('room:new-join-request', payload);
    }
  }

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
