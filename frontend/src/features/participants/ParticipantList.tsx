'use client';

import { Participant } from '@/types';
import { cn } from '@/lib/utils';

interface ParticipantListProps {
  participants: Participant[];
  isOwner: boolean;
  currentParticipantId: string | null;
  onRemove: (id: string) => void;
}

export default function ParticipantList({ participants, isOwner, currentParticipantId, onRemove }: ParticipantListProps) {
  const owner = participants.find((p) => p.role === 'OWNER');
  const guests = participants.filter((p) => p.role !== 'OWNER');

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 py-2">
        Participants ({participants.length})
      </h3>

      {owner && (
        <ParticipantRow
          participant={owner}
          isOwner={isOwner}
          isMe={owner.id === currentParticipantId}
          canRemove={false}
          onRemove={onRemove}
        />
      )}

      {guests.map((p) => (
        <ParticipantRow
          key={p.id}
          participant={p}
          isOwner={isOwner}
          isMe={p.id === currentParticipantId}
          canRemove={isOwner && p.id !== currentParticipantId}
          onRemove={onRemove}
        />
      ))}

      {participants.length === 0 && (
        <p className="text-xs text-white/30 text-center py-4">No participants yet</p>
      )}
    </div>
  );
}

function ParticipantRow({
  participant,
  isOwner,
  isMe,
  canRemove,
  onRemove,
}: {
  participant: Participant;
  isOwner: boolean;
  isMe: boolean;
  canRemove: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 group transition-colors">
      <div className="relative flex-none">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
          participant.role === 'OWNER' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400',
        )}>
          {participant.name.charAt(0).toUpperCase()}
        </div>
        <span className={cn(
          'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-navy-800',
          participant.isOnline ? 'bg-green-400' : 'bg-white/20',
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-sm font-medium truncate', isMe ? 'text-violet-300' : 'text-white/90')}>
            {participant.name}
          </span>
          {isMe && <span className="text-[10px] text-white/30">(you)</span>}
        </div>
        <div className="flex items-center gap-1">
          {participant.role === 'OWNER' && (
            <span className="text-[10px] text-amber-400 font-semibold">HOST</span>
          )}
          {!participant.isOnline && (
            <span className="text-[10px] text-white/30">offline</span>
          )}
        </div>
      </div>

      {canRemove && (
        <button
          onClick={() => onRemove(participant.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Remove participant"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Remove
        </button>
      )}
    </div>
  );
}
