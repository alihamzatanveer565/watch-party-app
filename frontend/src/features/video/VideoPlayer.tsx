'use client';

import { useEffect, useRef, useCallback } from 'react';
import { VideoState } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type YTPlayerEvent = { data: number; target: any };

interface VideoPlayerProps {
  videoState: VideoState | null;
  isOwner: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
}

let ytApiLoaded = false;

export default function VideoPlayer({ videoState, isOwner, onPlay, onPause, onSeek }: VideoPlayerProps) {
  const playerRef       = useRef<any>(null);
  const containerRef    = useRef<HTMLDivElement>(null);
  const isSyncingRef    = useRef(false);
  const lastStateRef    = useRef<number>(-1);
  const lastVideoIdRef  = useRef<string>('');
  const pendingVideoId  = useRef<string>('');   // always holds latest videoId for the API-ready callback
  const onPlayRef       = useRef(onPlay);
  const onPauseRef      = useRef(onPause);
  const onSeekRef       = useRef(onSeek);

  // Keep callback refs fresh so initPlayer never captures stale handlers
  useEffect(() => { onPlayRef.current  = onPlay;  }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onSeekRef.current  = onSeek;  }, [onSeek]);

  // ─── Create the YT.Player instance ────────────────────────────────────────
  const initPlayer = useCallback((videoId: string) => {
    if (!containerRef.current) return;
    if (playerRef.current) return;           // already created

    lastVideoIdRef.current = videoId;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay:       0,
        controls:       isOwner ? 1 : 0,
        modestbranding: 1,
        rel:            0,
        fs:             1,
        playsinline:    1,
        disablekb:      isOwner ? 0 : 1,
      },
      events: {
        onReady: (event: YTPlayerEvent) => {
          event.target.seekTo(0, true);
        },
        onStateChange: (event: YTPlayerEvent) => {
          if (isSyncingRef.current || !isOwner) return;

          const state  = event.data;
          const player = event.target;

          if (state === window.YT.PlayerState.PLAYING &&
              lastStateRef.current !== window.YT.PlayerState.PLAYING) {
            onPlayRef.current(player.getCurrentTime());
          } else if (
            state === window.YT.PlayerState.PAUSED &&
            lastStateRef.current === window.YT.PlayerState.PLAYING
          ) {
            onPauseRef.current(player.getCurrentTime());
          }

          if (
            state === window.YT.PlayerState.PLAYING ||
            state === window.YT.PlayerState.PAUSED
          ) {
            lastStateRef.current = state;
          }
        },
        onError: () => {},
      },
    });
  }, [isOwner]); // only isOwner — no videoState dependency

  // ─── Load YouTube IFrame API script once ──────────────────────────────────
  useEffect(() => {
    if (!ytApiLoaded) {
      ytApiLoaded = true;
      const tag   = document.createElement('script');
      tag.src     = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // The callback reads from pendingVideoId ref, so it always gets the latest value
    window.onYouTubeIframeAPIReady = () => {
      if (pendingVideoId.current) initPlayer(pendingVideoId.current);
    };

    // If the API was already loaded before this component mounted
    if (window.YT?.Player && pendingVideoId.current) {
      initPlayer(pendingVideoId.current);
    }
  }, [initPlayer]);

  // ─── React when videoState.youtubeVideoId arrives or changes ──────────────
  useEffect(() => {
    const videoId = videoState?.youtubeVideoId;
    if (!videoId) return;

    pendingVideoId.current = videoId;   // keep ref in sync

    if (!playerRef.current) {
      // Player not created yet — create it now if the API is ready
      if (window.YT?.Player) initPlayer(videoId);
      // Otherwise onYouTubeIframeAPIReady will pick it up from pendingVideoId
      return;
    }

    // Player already exists — swap the video if the ID changed
    if (videoId !== lastVideoIdRef.current) {
      lastVideoIdRef.current = videoId;
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoState?.youtubeVideoId, initPlayer]);

  // ─── Sync play / pause / seek for participants ────────────────────────────
  useEffect(() => {
    if (!playerRef.current || isOwner || !videoState) return;

    isSyncingRef.current = true;

    try {
      const currentPlayerTime = playerRef.current.getCurrentTime?.() ?? 0;
      const diff = Math.abs(currentPlayerTime - videoState.currentTime);

      if (diff > 1.5) playerRef.current.seekTo(videoState.currentTime, true);

      if (videoState.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (_) {}

    setTimeout(() => { isSyncingRef.current = false; }, 500);
  }, [videoState, isOwner]);

  // ─── Seek detection interval for owner ───────────────────────────────────
  useEffect(() => {
    if (!isOwner) return;
    let lastTime = 0;

    const interval = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const current = playerRef.current.getCurrentTime?.() ?? 0;
        if (
          Math.abs(current - lastTime) > 2 &&
          lastStateRef.current === window.YT?.PlayerState.PLAYING
        ) {
          onSeekRef.current(current);
        }
        lastTime = current;
      } catch (_) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [isOwner]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-black"
      />
      {!isOwner && (
        <div
          className="absolute inset-0 z-10 cursor-not-allowed"
          title="Only the host controls playback"
        />
      )}
    </div>
  );
}
