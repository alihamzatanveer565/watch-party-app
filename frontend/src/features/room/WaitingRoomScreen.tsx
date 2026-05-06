'use client';

import { Room } from '@/types';

interface WaitingRoomScreenProps {
  status: 'pending' | 'rejected' | 'removed';
  room?: Room | null;
  removedMessage?: string | null;
  guestName?: string;
}

export default function WaitingRoomScreen({ status, room, removedMessage, guestName }: WaitingRoomScreenProps) {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Waiting for approval</h2>
            <p className="text-white/50 text-sm mb-4">
              {guestName ? `Hi ${guestName}! ` : ''}The host needs to approve your request to join
              {room ? ` "${room.name}"` : ''}.
            </p>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Request declined</h2>
            <p className="text-white/50 text-sm">Your request to join was declined by the host.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 text-sm text-violet-400 hover:text-violet-300 underline"
            >
              Go back home
            </button>
          </>
        )}

        {status === 'removed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-orange-600/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Removed from room</h2>
            <p className="text-white/50 text-sm">{removedMessage || 'You were removed from this room by the owner.'}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 text-sm text-violet-400 hover:text-violet-300 underline"
            >
              Go back home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
