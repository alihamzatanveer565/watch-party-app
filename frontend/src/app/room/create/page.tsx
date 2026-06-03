'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { roomsService } from '@/services/rooms.service';
import { RoomVisibility } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { extractYoutubeId } from '@/lib/utils';

export default function CreateRoomPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<RoomVisibility>('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Room name is required';
    if (!youtubeUrl.trim()) e.youtubeUrl = 'YouTube URL is required';
    else if (!extractYoutubeId(youtubeUrl)) e.youtubeUrl = 'Invalid YouTube URL';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const room = await roomsService.create(name.trim(), youtubeUrl.trim(), description.trim() || undefined, visibility);
      toast.success('Room created!');
      router.push(`/room/${room.inviteCode}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Back + brand */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <span className="text-sm font-semibold text-white/70">WatchParty</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Create a Room</h1>
            <p className="text-white/45 text-sm">Set up a watch party for your friends</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Room Name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              placeholder="Movie Night with Friends"
              error={errors.name}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">YouTube URL</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                  </svg>
                </div>
                <input
                  value={youtubeUrl}
                  onChange={(e) => { setYoutubeUrl(e.target.value); setErrors((p) => ({ ...p, youtubeUrl: '' })); }}
                  placeholder="https://youtube.com/watch?v=..."
                  className={`w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.youtubeUrl ? 'border-red-500/60' : 'border-white/10'}`}
                />
              </div>
              {errors.youtubeUrl && <p className="text-xs text-red-400">{errors.youtubeUrl}</p>}
              {youtubeUrl && extractYoutubeId(youtubeUrl) && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  Valid YouTube URL
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">Description <span className="text-white/30">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you watching tonight?"
                maxLength={300}
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">Room Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {visibilityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      visibility === opt.value
                        ? 'border-violet-500/60 bg-violet-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] leading-tight text-white/40">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Room & Get Invite Link
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/25 mt-4">
          Hosting as <span className="text-white/50">{user?.name}</span>
        </p>
      </div>
    </div>
  );
}

const visibilityOptions: { value: RoomVisibility; icon: string; label: string; desc: string }[] = [
  { value: 'PUBLIC', icon: '🌐', label: 'Public', desc: 'Listed on home, anyone joins instantly' },
  { value: 'UNLISTED', icon: '🔗', label: 'Unlisted', desc: 'Link only, auto-approved' },
  { value: 'PRIVATE', icon: '🔒', label: 'Private', desc: 'Invite only, host approves' },
];
