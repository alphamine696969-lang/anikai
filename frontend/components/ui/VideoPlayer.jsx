'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { historyAPI } from '@/lib/api';
import { useAuth }    from '@/lib/auth';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, SkipBack, Settings, Subtitles,
} from 'lucide-react';

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({ url, episodeId, animeId, onEnded, title }) {
  const { user } = useAuth();
  const videoRef   = useRef(null);
  const wrapRef    = useRef(null);
  const saveTimer  = useRef(null);
  const hideTimer  = useRef(null);

  const [playing,    setPlaying]    = useState(false);
  const [muted,      setMuted]      = useState(false);
  const [volume,     setVolume]     = useState(1);
  const [progress,   setProgress]   = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [buffered,   setBuffered]   = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCtrl,   setShowCtrl]   = useState(true);
  const [loading,    setLoading]    = useState(true);

  // Hide controls after 3s of inactivity
  const resetHideTimer = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowCtrl(false); }, 3000);
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url) return;

    const onLoaded   = () => { setDuration(v.duration); setLoading(false); };
    const onTime     = () => {
      setProgress(v.currentTime);
      // Buffered
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
      // Auto-save progress every 10s
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveProgress(v.currentTime, v.ended), 10000);
    };
    const onEnding   = () => { saveProgress(v.currentTime, true); onEnded?.(); };
    const onWaiting  = () => setLoading(true);
    const onPlaying  = () => setLoading(false);

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate',     onTime);
    v.addEventListener('ended',          onEnding);
    v.addEventListener('waiting',        onWaiting);
    v.addEventListener('playing',        onPlaying);

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate',     onTime);
      v.removeEventListener('ended',          onEnding);
      v.removeEventListener('waiting',        onWaiting);
      v.removeEventListener('playing',        onPlaying);
      clearTimeout(saveTimer.current);
    };
  }, [url]);

  const saveProgress = async (currentTime, completed = false) => {
    if (!user || !episodeId) return;
    try {
      await historyAPI.updateProgress({
        episode_id: episodeId,
        anime_id:   animeId,
        progress:   Math.floor(currentTime),
        completed,
      });
    } catch {}
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
    setPlaying(!playing);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  const skip = (sec) => {
    videoRef.current.currentTime = Math.min(duration, Math.max(0, videoRef.current.currentTime + sec));
  };

  const toggleMute = () => {
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (e) => {
    const v = Number(e.target.value);
    videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space')       { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight')  skip(10);
      if (e.code === 'ArrowLeft')   skip(-10);
      if (e.code === 'KeyF')        toggleFullscreen();
      if (e.code === 'KeyM')        toggleMute();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [playing, muted]);

  const progressPct = duration ? (progress / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-full bg-black rounded-xl overflow-hidden group select-none"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
          No video available
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        preload="metadata"
      />

      {/* Loading spinner */}
      {loading && url && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showCtrl ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Title */}
        <div className="px-5 py-3">
          {title && <p className="text-sm font-semibold text-white/90 drop-shadow">{title}</p>}
        </div>

        {/* Progress bar */}
        <div
          className="mx-5 mb-3 h-1.5 bg-white/20 rounded-full cursor-pointer relative group/bar"
          onClick={seek}
        >
          {/* Buffered */}
          <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${bufferedPct}%` }} />
          {/* Played */}
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity -translate-x-1/2"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 px-5 pb-4">
          <button onClick={() => skip(-10)} className="text-white/80 hover:text-white transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
            {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-current" />}
          </button>
          <button onClick={() => skip(10)} className="text-white/80 hover:text-white transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 group/vol">
            <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={changeVolume}
              className="w-0 group-hover/vol:w-20 opacity-0 group-hover/vol:opacity-100 transition-all accent-blue-500"
            />
          </div>

          <span className="text-xs text-white/70 ml-1">
            {fmt(progress)} / {fmt(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-colors">
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
