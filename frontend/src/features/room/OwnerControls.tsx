'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { extractYoutubeId } from '@/lib/utils';
import { RoomVisibility } from '@/types';
import toast from 'react-hot-toast';

interface OwnerControlsProps {
  onChangeVideo: (url: string, videoId: string) => void;
  roomId: string;
  currentVisibility: RoomVisibility;
  onVisibilityChange: (visibility: RoomVisibility) => void;
}

const visibilityOptions: { value: RoomVisibility; icon: string; label: string; desc: string }[] = [
  { value: 'PUBLIC', icon: '🌐', label: 'Public', desc: 'Listed on home' },
  { value: 'UNLISTED', icon: '🔗', label: 'Unlisted', desc: 'Link only' },
  { value: 'PRIVATE', icon: '🔒', label: 'Private', desc: 'Host approval' },
];

export default function OwnerControls({ onChangeVideo, currentVisibility, onVisibilityChange }: OwnerControlsProps) {
  const [url, setUrl] = useState('');
  const [videoOpen, setVideoOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [error, setError] = useState('');
  const [savingVisibility, setSavingVisibility] = useState(false);

  const handleChangeVideo = () => {
    const videoId = extractYoutubeId(url.trim());
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }
    onChangeVideo(url.trim(), videoId);
    setUrl('');
    setVideoOpen(false);
    toast.success('Video changed!');
  };

  const handleVisibilityChange = async (v: RoomVisibility) => {
    if (v === currentVisibility) return;
    setSavingVisibility(true);
    try {
      await onVisibilityChange(v);
      toast.success(`Room is now ${v.toLowerCase()}`);
    } catch {
      toast.error('Failed to update visibility');
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Change Video */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <button
          onClick={() => setVideoOpen((v) => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-white/70 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
            </svg>
            Change Video
          </span>
          <svg className={`w-4 h-4 transition-transform ${videoOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {videoOpen && (
          <div className="mt-3 flex flex-col gap-2">
            <Input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              placeholder="https://youtube.com/watch?v=..."
              error={error}
              className="text-xs"
            />
            <Button size="sm" onClick={handleChangeVideo} disabled={!url.trim()}>
              Load Video
            </Button>
          </div>
        )}
      </div>

      {/* Change Visibility */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <button
          onClick={() => setVisibilityOpen((v) => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-white/70 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm">
              {currentVisibility === 'PUBLIC' ? '🌐' : currentVisibility === 'UNLISTED' ? '🔗' : '🔒'}
            </span>
            Room Visibility
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              currentVisibility === 'PUBLIC'
                ? 'text-green-400 bg-green-400/10'
                : currentVisibility === 'UNLISTED'
                ? 'text-blue-400 bg-blue-400/10'
                : 'text-white/30 bg-white/5'
            }`}>
              {currentVisibility}
            </span>
          </span>
          <svg className={`w-4 h-4 transition-transform ${visibilityOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {visibilityOpen && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={savingVisibility}
                onClick={() => handleVisibilityChange(opt.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all disabled:opacity-50 ${
                  currentVisibility === opt.value
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20'
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                <span className="text-[9px] text-white/30 leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
