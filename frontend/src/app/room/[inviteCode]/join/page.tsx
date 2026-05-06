'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { roomsService } from '@/services/rooms.service';
import { authService } from '@/services/auth.service';
import { Room } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsService.getByInviteCode(inviteCode)
      .then(setRoom)
      .catch(() => setError('Room not found or no longer available.'))
      .finally(() => setLoading(false));

    // Pre-fill name if authenticated
    const user = authService.getUser();
    if (user) setGuestName(user.name);
  }, [inviteCode]);

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) { setError('Please enter your name'); return; }
    // Navigate to room with name param
    router.push(`/room/${inviteCode}?name=${encodeURIComponent(guestName.trim())}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Room Not Found</h2>
          <p className="text-white/45 text-sm mb-6">{error}</p>
          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="absolute top-24 left-1/3 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <span className="font-bold text-white">WatchParty</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-7">
          {/* Room info */}
          <div className="flex items-start gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-white/10 flex items-center justify-center flex-none">
              <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div>
              <h2 className="font-bold text-white text-base">{room?.name}</h2>
              <p className="text-xs text-white/40">
                Hosted by <span className="text-white/60">{room?.owner?.name}</span>
              </p>
              {room?.description && (
                <p className="text-xs text-white/40 mt-1">{room.description}</p>
              )}
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white mb-4">Enter your name to request access</h3>

          <form onSubmit={handleJoin} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">
                {error}
              </div>
            )}
            <Input
              label="Your name"
              value={guestName}
              onChange={(e) => { setGuestName(e.target.value); setError(''); }}
              placeholder="How should the host know you?"
              autoFocus
            />
            <Button type="submit" className="w-full" size="lg" disabled={!guestName.trim()}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Request to Join
            </Button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            The host will approve or reject your request
          </p>
        </div>
      </div>
    </div>
  );
}
