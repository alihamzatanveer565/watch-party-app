'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chat.service';
import RoomLayout from '@/features/room/RoomLayout';
import WaitingRoomScreen from '@/features/room/WaitingRoomScreen';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;
  const guestNameParam = searchParams.get('name') || undefined;

  const { user, loading: authLoading } = useAuth();

  // Preload YouTube IFrame API as early as possible so it's ready the moment the user
  // gets approved — this eliminates the 2-4s black screen from lazy-loading the script.
  useEffect(() => {
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  const currentUserName = user?.name || guestNameParam || 'Guest';

  const {
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
    changeVisibility,
    setMessages,
    hostDisconnected,
    hostGraceSecondsLeft,
  } = useRoom({ inviteCode, guestName: guestNameParam, authReady: !authLoading });

  // Redirect guests who haven't entered a name
  useEffect(() => {
    if (!authLoading && !user && !guestNameParam) {
      router.replace(`/room/${inviteCode}/join`);
    }
  }, [authLoading, user, guestNameParam, inviteCode, router]);

  // Load chat history once approved
  useEffect(() => {
    if (status === 'approved' && room?.id) {
      chatService.getMessages(room.id)
        .then((msgs) => setMessages(msgs))
        .catch(() => {});
    }
  }, [status, room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || (!user && !guestNameParam)) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'pending' || status === 'rejected' || status === 'removed') {
    return (
      <WaitingRoomScreen
        status={status}
        room={room}
        removedMessage={removedMessage}
        guestName={currentUserName}
      />
    );
  }

  if (status === 'approved' && room) {
    return (
      <RoomLayout
        room={room}
        isOwner={isOwner}
        participantId={participantId}
        participants={participants}
        messages={messages}
        pendingRequests={pendingRequests}
        videoState={videoState}
        currentUserName={currentUserName}
        hostDisconnected={hostDisconnected}
        hostGraceSecondsLeft={hostGraceSecondsLeft}
        onPlay={videoPlay}
        onPause={videoPause}
        onSeek={videoSeek}
        onVideoChange={videoChange}
        onSendMessage={sendMessage}
        onDeleteMessage={deleteMessage}
        onRemoveParticipant={removeParticipant}
        onApprove={approveUser}
        onReject={rejectUser}
        onVisibilityChange={(v) => changeVisibility(room.id, v)}
        onLeave={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-white/45 text-sm">Connecting to room...</p>
      </div>
    </div>
  );
}
