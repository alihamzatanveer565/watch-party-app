'use client';

import { useState, useCallback } from 'react';
import { Room, Participant, ChatMessage, JoinRequest, VideoState, RoomVisibility } from '@/types';
import VideoPlayer from '@/features/video/VideoPlayer';
import ChatPanel from '@/features/chat/ChatPanel';
import ParticipantList from '@/features/participants/ParticipantList';
import JoinRequestPanel from '@/features/participants/JoinRequestPanel';
import OwnerControls from '@/features/room/OwnerControls';
import { getInviteUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RoomLayoutProps {
  room: Room;
  isOwner: boolean;
  participantId: string | null;
  participants: Participant[];
  messages: ChatMessage[];
  pendingRequests: JoinRequest[];
  videoState: VideoState | null;
  currentUserName: string;
  hostDisconnected: boolean;
  hostGraceSecondsLeft: number;
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onVideoChange: (url: string, videoId: string) => void;
  onSendMessage: (content: string) => void;
  onDeleteMessage: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onVisibilityChange: (visibility: RoomVisibility) => void;
  onLeave: () => void;
}

type Tab = 'chat' | 'participants';

export default function RoomLayout({
  room,
  isOwner,
  participantId,
  participants,
  messages,
  pendingRequests,
  videoState,
  currentUserName,
  hostDisconnected,
  hostGraceSecondsLeft,
  onPlay,
  onPause,
  onSeek,
  onVideoChange,
  onSendMessage,
  onDeleteMessage,
  onRemoveParticipant,
  onApprove,
  onReject,
  onVisibilityChange,
  onLeave,
}: RoomLayoutProps) {
  const [tab, setTab] = useState<Tab>('chat');

  const copyInvite = useCallback(() => {
    const url = getInviteUrl(room.inviteCode);
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  }, [room.inviteCode]);

  return (
    <div className="flex flex-col h-screen bg-navy-900 overflow-hidden">
      {/* Top bar */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/10 bg-navy-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-none" />
          <h1 className="text-sm font-bold text-white truncate">{room.name}</h1>
          {isOwner && (
            <span className="hidden sm:flex text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex-none">
              HOST
            </span>
          )}
          <span className={`hidden sm:flex text-[10px] font-bold px-2 py-0.5 rounded-full flex-none ${
            room.visibility === 'PUBLIC'
              ? 'text-green-400 bg-green-400/10'
              : room.visibility === 'UNLISTED'
              ? 'text-blue-400 bg-blue-400/10'
              : 'text-white/30 bg-white/5'
          }`}>
            {room.visibility ?? 'PRIVATE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyInvite}
            className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Invite
          </button>
          <button
            onClick={onLeave}
            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg px-3 py-1.5 transition-all"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Host disconnected banner */}
      {hostDisconnected && (
        <div className="flex-none flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-none" />
            Host disconnected — watch party paused. Waiting for host to return&hellip;
          </span>
          {hostGraceSecondsLeft > 0 && (
            <span className="flex-none font-mono text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {Math.floor(hostGraceSecondsLeft / 60)}:{String(hostGraceSecondsLeft % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <main className="flex-1 flex flex-col overflow-hidden p-3 lg:p-4 gap-3">
          <VideoPlayer
            videoState={videoState}
            isOwner={isOwner}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
          />

          {/* Mobile invite + tabs */}
          <div className="sm:hidden flex gap-2">
            <button
              onClick={copyInvite}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg py-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Invite
            </button>
          </div>

          {/* Mobile tab bar */}
          <div className="lg:hidden flex border-b border-white/10 -mx-1">
            {(['chat', 'participants'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'text-violet-400 border-b-2 border-violet-400' : 'text-white/40'
                }`}
              >
                {t}
                {t === 'participants' && ` (${participants.length})`}
                {t === 'chat' && pendingRequests.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile panels */}
          <div className="lg:hidden flex-1 overflow-hidden">
            {tab === 'chat' && (
              <div className="h-full flex flex-col">
                {isOwner && pendingRequests.length > 0 && (
                  <div className="flex-none p-2">
                    <JoinRequestPanel requests={pendingRequests} onApprove={onApprove} onReject={onReject} />
                  </div>
                )}
                <div className="flex-1 overflow-hidden bg-navy-800/60 rounded-xl border border-white/10">
                  <ChatPanel
                    messages={messages}
                    isOwner={isOwner}
                    currentUserName={currentUserName}
                    onSend={onSendMessage}
                    onDelete={onDeleteMessage}
                  />
                </div>
              </div>
            )}
            {tab === 'participants' && (
              <div className="h-full overflow-y-auto bg-navy-800/60 rounded-xl border border-white/10 p-2">
                <ParticipantList
                  participants={participants}
                  isOwner={isOwner}
                  currentParticipantId={participantId}
                  onRemove={onRemoveParticipant}
                />
              </div>
            )}
          </div>
        </main>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-white/10 bg-navy-800/60 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Owner controls */}
            {isOwner && (
              <div className="flex-none p-3 border-b border-white/10 space-y-2">
                {pendingRequests.length > 0 && (
                  <JoinRequestPanel requests={pendingRequests} onApprove={onApprove} onReject={onReject} />
                )}
                <OwnerControls
                  onChangeVideo={onVideoChange}
                  roomId={room.id}
                  currentVisibility={room.visibility ?? 'PRIVATE'}
                  onVisibilityChange={onVisibilityChange}
                />
              </div>
            )}

            {/* Participants */}
            <div className="flex-none border-b border-white/10 max-h-64 overflow-y-auto">
              <ParticipantList
                participants={participants}
                isOwner={isOwner}
                currentParticipantId={participantId}
                onRemove={onRemoveParticipant}
              />
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={messages}
                isOwner={isOwner}
                currentUserName={currentUserName}
                onSend={onSendMessage}
                onDelete={onDeleteMessage}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
