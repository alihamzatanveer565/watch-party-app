'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { extractYoutubeId } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OwnerControlsProps {
  onChangeVideo: (url: string, videoId: string) => void;
}

export default function OwnerControls({ onChangeVideo }: OwnerControlsProps) {
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleChange = () => {
    const videoId = extractYoutubeId(url.trim());
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }
    onChangeVideo(url.trim(), videoId);
    setUrl('');
    setOpen(false);
    toast.success('Video changed!');
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold text-white/70 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
          </svg>
          Change Video
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="https://youtube.com/watch?v=..."
            error={error}
            className="text-xs"
          />
          <Button size="sm" onClick={handleChange} disabled={!url.trim()}>
            Load Video
          </Button>
        </div>
      )}
    </div>
  );
}
