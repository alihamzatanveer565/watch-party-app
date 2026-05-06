'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, Participant, ChatMessage, JoinRequest, VideoState, RoomUserStatus } from '@/types';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

interface UseRoomOptions {
  inviteCode: string;
  guestName?: string;
}

export function useRoom({ inviteCode, guestName }: UseRoomOptions) {
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

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
        { transports: ['websocket'] },
      );
    }
    return socketRef.current;
  }, []);

  const sendJoinRequest = useCallback(() => {
    const socket = getSocket();
    const token = authService.getToken();
    socket.emit('room:join-request', { inviteCode, guestName, token });
    setStatus('pending');
  }, [inviteCode, guestName, getSocket]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('room:user-approved', (data: { roomId: string; participantId: string; isOwner: boolean; room: Room }) => {
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
      setPendingRequests((prev) => [...prev, req]);
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

    socket.on('error', (err: { message: string }) => {
      toast.error(err.message);
    });

    return () => {
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
      socket.off('error');
    };
  }, [getSocket]);

  // Auto-join on mount
  useEffect(() => {
    if (inviteCode && (guestName || authService.getToken())) {
      sendJoinRequest();
    }
  }, [inviteCode, guestName, sendJoinRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    approveUser,
    rejectUser,
    sendMessage,
    deleteMessage,
    removeParticipant,
    videoPlay,
    videoPause,
    videoSeek,
    videoChange,
    requestSync,
    setMessages,
  };
}
