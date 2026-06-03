'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { roomsService } from '@/services/rooms.service';
import type { PublicRoomCard as PublicRoomCardType } from '@/types';

/** Public YouTube video for the landing “room preview” mockup (swap anytime). */
const LANDING_PREVIEW_VIDEO_ID = 'zGRPON4FcBk';

export default function LandingPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoomCardType[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    roomsService.getPublicRooms()
      .then(setPublicRooms)
      .catch(() => {})
      .finally(() => setRoomsLoading(false));
  }, []);

  const handleJoin = () => {
    const code = inviteCode.trim();
    if (!code) return;
    router.push(`/room/${code}`);
  };

  return (
    <div className="min-h-screen bg-navy-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4 bg-navy-900/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg">WatchParty</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Log in</Link>
          <Link href="/auth/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Watch Together,{' '}
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              In Perfect Sync
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Host YouTube watch parties with real-time sync, live chat, and effortless invite links.
            No plugins. No extensions. Just share and watch.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-lg mx-auto">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create a Room
              </Button>
            </Link>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Enter invite code..."
                className="flex-1 sm:w-48 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <Button variant="secondary" size="lg" onClick={handleJoin} disabled={!inviteCode.trim()}>
                Join
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Preview mockup — wide “browser tab” card; video uses cover sizing (no side bars) */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-navy-800/50 backdrop-blur-sm shadow-2xl shadow-black/50">
            {/* Fake titlebar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-navy-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 text-center text-xs text-white/30">watchparty.app/room/movie-night</div>
            </div>
            {/* Fake room UI */}
            <div className="flex h-[min(56vw,22rem)] md:h-[min(42vw,36rem)] min-h-[14rem]">
              <div className="flex-1 min-w-0 bg-black relative overflow-hidden youtube-cover-host">
                <div className="youtube-cover-surface">
                  <iframe
                    src={`https://www.youtube.com/embed/${LANDING_PREVIEW_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${LANDING_PREVIEW_VIDEO_ID}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Watch Party Preview"
                    style={{ border: 'none', pointerEvents: 'none' }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white/70 font-medium">LIVE</span>
                </div>
              </div>
              <div className="w-48 md:w-64 border-l border-white/10 flex flex-col">
                <div className="flex-none px-3 py-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-white/50">Live Chat</span>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-hidden">
                  {[
                    { name: 'Alex', msg: 'This is amazing! 🔥', owner: true },
                    { name: 'Sam', msg: 'Loving the sync!', owner: false },
                    { name: 'Jordan', msg: 'Can we replay that?', owner: false },
                  ].map((m, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold ${m.owner ? 'text-amber-400' : 'text-cyan-400'}`}>{m.name}</span>
                        {m.owner && <span className="text-[8px] text-amber-400 bg-amber-400/10 px-1 rounded">HOST</span>}
                      </div>
                      <p className="text-xs text-white/70 bg-white/5 rounded px-2 py-1">{m.msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live public rooms */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Live Rooms</h2>
            <p className="text-white/40 text-sm mt-1">Jump into an ongoing watch party — no invite needed</p>
          </div>

          {roomsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : publicRooms.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-white/30 text-sm">No public rooms right now.</p>
              <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 text-sm mt-1 inline-block">
                Be the first to start one!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {publicRooms.map((room) => (
                <PublicRoomCardUI
                  key={room.id}
                  room={room}
                  onJoin={() => router.push(`/room/${room.inviteCode}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Everything you need for the{' '}
            <span className="text-violet-400">perfect watch party</span>
          </h2>
          <p className="text-white/40 text-center mb-14 max-w-xl mx-auto">
            Built for groups who want a seamless, synchronized viewing experience without any friction.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-violet-500/30 transition-colors group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-white/40 mb-14">Up and running in under 60 seconds.</p>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 text-left rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white flex-none">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-sm text-white/45">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to watch together?
          </h2>
          <p className="text-white/45 mb-8">Create a free room in seconds. No credit card needed.</p>
          <Link href="/auth/signup">
            <Button size="lg">
              Start Your Watch Party
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 text-center text-xs text-white/20">
        © {new Date().getFullYear()} WatchParty. Made with ❤️ for movie nights.
      </footer>
    </div>
  );
}

const features = [
  {
    title: 'Perfectly Synchronized',
    desc: 'Every play, pause, and seek is instantly reflected for all participants. Auto-corrects drift over 1.5s.',
    iconBg: 'bg-violet-600/20',
    icon: (
      <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    title: 'Live Chat',
    desc: 'React in real-time with text messages, emojis, and full moderation controls for the host.',
    iconBg: 'bg-blue-600/20',
    icon: (
      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: 'Host Controls',
    desc: 'Approve who joins, remove disruptive participants, and manage the viewing experience end to end.',
    iconBg: 'bg-cyan-600/20',
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Guest-Friendly',
    desc: 'Participants join with just their name — no account required. Share a link and they\'re in.',
    iconBg: 'bg-green-600/20',
    icon: (
      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: 'YouTube Native',
    desc: 'Uses the official YouTube IFrame API. Works with any public YouTube video, including playlists and Shorts.',
    iconBg: 'bg-red-600/20',
    icon: (
      <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
      </svg>
    ),
  },
  {
    title: 'Invite in One Click',
    desc: 'Share a unique room link. No sign-up required for guests — just a name and they\'re ready to join.',
    iconBg: 'bg-amber-600/20',
    icon: (
      <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
];

const steps = [
  { title: 'Sign up as host', desc: 'Create a free account to host rooms and control playback for your guests.' },
  { title: 'Create a room', desc: 'Paste a YouTube link, name your room, and get a unique invite code instantly.' },
  { title: 'Invite friends', desc: 'Share the invite link. Guests join with just their name — no account needed.' },
  { title: 'Watch together', desc: 'Control play, pause, and seek for everyone. Chat in real-time and enjoy the show.' },
];

function PublicRoomCardUI({ room, onJoin }: { room: PublicRoomCardType; onJoin: () => void }) {
  return (
    <div className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/40 transition-all duration-200 flex flex-col">
      <div className="relative aspect-video bg-navy-800 overflow-hidden">
        <img
          src={`https://img.youtube.com/vi/${room.youtubeVideoId}/mqdefault.jpg`}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-white font-medium">{room.participantCount}</span>
        </div>
        <div className="absolute top-2 left-2 bg-violet-600/80 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-[10px] text-white font-semibold uppercase tracking-wide">Public</span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white truncate">{room.name}</h3>
          {room.description && (
            <p className="text-xs text-white/40 mt-1 line-clamp-2">{room.description}</p>
          )}
          <p className="text-xs text-white/30 mt-1.5">
            by <span className="text-white/50">{room.owner.name}</span>
          </p>
        </div>
        <button
          onClick={onJoin}
          className="w-full py-2 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white text-xs font-semibold transition-colors"
        >
          Join Now
        </button>
      </div>
    </div>
  );
}
