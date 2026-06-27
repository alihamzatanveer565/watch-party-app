'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, Participant, ChatMessage, JoinRequest, VideoState, RoomUserStatus, RoomVisibility } from '@/types';
import { authService } from '@/services/auth.service';
import { roomsService } from '@/services/rooms.service';
import toast from 'react-hot-toast';

interface UseRoomOptions {
  inviteCode: string;
  guestName?: string;
  authReady?: boolean;
}

export function useRoom({ inviteCode, guestName, authReady = true }: UseRoomOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<RoomUserStatus>('idle');
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [removedMessage, setRemovedMessage] = useState<string | null>(null);
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [hostGraceSecondsLeft, setHostGraceSecondsLeft] = useState(0);
  const graceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRef = useRef(false);

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
        { transports: ['websocket', 'polling'] },
      );
    }
    return socketRef.current;
  }, []);

  const sendJoinRequest = useCallback(() => {
    const socket = getSocket();
    const token = authService.getToken();

    const doJoin = () => {
      socket.emit('room:join-request', {
        inviteCode,
        guestName,
        ...(token ? { token } : {}),
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }
  }, [inviteCode, guestName, getSocket]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('room:user-approved', (data: { roomId: string; participantId: string; isOwner: boolean; room: Room }) => {
      joinedRef.current = true;
      setRoom(data.room);
      setParticipantId(data.participantId);
      setIsOwner(data.isOwner);
      setStatus('approved');
    });

    socket.on('room:user-rejected', () => {
      setStatus('rejected');
      toast.error('Your join request was declined.');
    });

    socket.on('room:removed', (data: { message: string }) => {
      setStatus('removed');
      setRemovedMessage(data.message);
    });

    socket.on('room:join-pending', () => {
      setStatus('pending');
    });

    socket.on('room:new-join-request', (req: JoinRequest) => {
      setPendingRequests((prev) =>
        prev.some((r) => r.requestId === req.requestId) ? prev : [...prev, req],
      );
      toast('New join request from ' + req.name, { icon: '👋' });
    });

    socket.on('room:participants-updated', (list: Participant[]) => {
      setParticipants(list);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat:delete', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, isRemoved: true, content: 'This message was removed by the owner.' } : m),
      );
    });

    socket.on('video:play', (data: { currentTime: number }) => {
      setVideoState((prev) => prev ? { ...prev, isPlaying: true, currentTime: data.currentTime } : null);
    });

    socket.on('video:pause', (data: { currentTime: number }) => {
      setVideoState((prev) => prev ? { ...prev, isPlaying: false, currentTime: data.currentTime } : null);
    });

    socket.on('video:seek', (data: { currentTime: number }) => {
      setVideoState((prev) => prev ? { ...prev, currentTime: data.currentTime } : null);
    });

    socket.on('video:sync', (data: VideoState) => {
      setVideoState(data);
    });

    socket.on('video:change', (data: { youtubeVideoId: string }) => {
      setVideoState((prev) => prev ? { ...prev, youtubeVideoId: data.youtubeVideoId, currentTime: 0, isPlaying: false } : null);
      setRoom((prev) => prev ? { ...prev, youtubeVideoId: data.youtubeVideoId } : null);
    });

    socket.on('room:user-left', () => {
      // participants update handled by room:participants-updated
    });

    socket.on('room:host-disconnected', ({ gracePeriodSeconds }: { gracePeriodSeconds: number }) => {
      setHostDisconnected(true);
      setHostGraceSecondsLeft(gracePeriodSeconds);
      if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
      graceIntervalRef.current = setInterval(() => {
        setHostGraceSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(graceIntervalRef.current!);
            graceIntervalRef.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    });

    socket.on('room:host-reconnected', () => {
      setHostDisconnected(false);
      setHostGraceSecondsLeft(0);
      if (graceIntervalRef.current) { clearInterval(graceIntervalRef.current); graceIntervalRef.current = null; }
    });

    socket.on('room:host-changed', (data: { newOwnerId: string; newOwnerName: string; participantId: string }) => {
      setHostDisconnected(false);
      setHostGraceSecondsLeft(0);
      if (graceIntervalRef.current) { clearInterval(graceIntervalRef.current); graceIntervalRef.current = null; }
      toast(`${data.newOwnerName} is now the host`, { icon: '👑' });
    });

    socket.on('room:you-are-host', () => {
      setIsOwner(true);
      toast.success('You are now the host of this room!');
    });

    socket.on('room:visibility-changed', (data: { visibility: RoomVisibility }) => {
      setRoom((prev) => prev ? { ...prev, visibility: data.visibility } : null);
    });

    socket.on('error', (err: { message: string }) => {
      toast.error(err.message);
    });

    socket.on('connect_error', () => {
      toast.error('Could not connect to the server. Please refresh the page.');
    });

    // Re-join after Socket.IO reconnects (common behind LiteSpeed/nginx proxies)
    const onReconnect = () => {
      if (!joinedRef.current) return;
      const token = authService.getToken();
      socket.emit('room:join-request', {
        inviteCode,
        guestName,
        ...(token ? { token } : {}),
      });
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.io.off('reconnect', onReconnect);
      socket.off('room:user-approved');
      socket.off('room:user-rejected');
      socket.off('room:removed');
      socket.off('room:join-pending');
      socket.off('room:new-join-request');
      socket.off('room:participants-updated');
      socket.off('chat:message');
      socket.off('chat:delete');
      socket.off('video:play');
      socket.off('video:pause');
      socket.off('video:seek');
      socket.off('video:sync');
      socket.off('video:change');
      socket.off('room:user-left');
      socket.off('room:host-disconnected');
      socket.off('room:host-reconnected');
      socket.off('room:host-changed');
      socket.off('room:you-are-host');
      socket.off('room:visibility-changed');
      socket.off('error');
      socket.off('connect_error');
    };
  }, [getSocket, inviteCode, guestName]);

  // Auto-join once auth is resolved and we have identity (logged-in user or guest name)
  useEffect(() => {
    if (!authReady) return;
    if (inviteCode && (guestName || authService.getToken())) {
      sendJoinRequest();
    }
  }, [inviteCode, guestName, authReady, sendJoinRequest]);

  // Poll pending join requests for hosts (fallback when socket event is missed)
  useEffect(() => {
    if (status !== 'approved' || !isOwner || !room?.id) return;

    const loadPending = () => {
      roomsService.getPendingRequests(room.id)
        .then(setPendingRequests)
        .catch(() => {});
    };

    loadPending();
    const interval = setInterval(loadPending, 5000);
    return () => clearInterval(interval);
  }, [status, isOwner, room?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const approveUser = useCallback((requestId: string) => {
    socketRef.current?.emit('room:approve-user', { requestId });
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  }, []);

  const rejectUser = useCallback((requestId: string) => {
    socketRef.current?.emit('room:reject-user', { requestId });
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  }, []);

  const sendMessage = useCallback((content: string) => {
    socketRef.current?.emit('chat:message', { content });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('chat:delete', { messageId });
  }, []);

  const removeParticipant = useCallback((pid: string) => {
    socketRef.current?.emit('participant:remove', { participantId: pid });
  }, []);

  const videoPlay = useCallback((currentTime: number) => {
    socketRef.current?.emit('video:play', { currentTime });
  }, []);

  const videoPause = useCallback((currentTime: number) => {
    socketRef.current?.emit('video:pause', { currentTime });
  }, []);

  const videoSeek = useCallback((currentTime: number) => {
    socketRef.current?.emit('video:seek', { currentTime });
  }, []);

  const videoChange = useCallback((youtubeUrl: string, youtubeVideoId: string) => {
    socketRef.current?.emit('video:change', { youtubeUrl, youtubeVideoId });
  }, []);

  const requestSync = useCallback(() => {
    socketRef.current?.emit('video:request-sync');
  }, []);

  const changeVisibility = useCallback(async (roomId: string, visibility: RoomVisibility) => {
    await roomsService.updateVisibility(roomId, visibility);
    setRoom((prev) => prev ? { ...prev, visibility } : null);
    socketRef.current?.emit('room:visibility-changed', { visibility });
  }, []);

  return {
    status,
    room,
    participants,
    messages,
    pendingRequests,
    videoState,
    participantId,
    isOwner,
    removedMessage,
    hostDisconnected,
    hostGraceSecondsLeft,
    approveUser,
    rejectUser,
    sendMessage,
    deleteMessage,
    removeParticipant,
    videoPlay,
    videoPause,
    videoSeek,
    videoChange,
    changeVisibility,
    requestSync,
    setMessages,
  };
}
