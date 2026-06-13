'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Loader2, Settings, X, List, Sun, Lock, Unlock, RotateCcw, RotateCw, Download } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useProgressStore } from '@/store/progressStore';
import { motion, AnimatePresence } from 'framer-motion';

import { Camera, PictureInPicture2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

declare global { interface Window { Hls: any; } }

interface Props {
  streamUrl: string; slug: string; episodeId: string;
  isFetchingStream?: boolean; streamFetchError?: string; onRetry?: () => void;
  episodes?: any[]; currentEp?: any; onEpisodeSelect?: (ep: any) => void;
  onEnded?: () => void; onProgress?: (t: number, d: number) => void; autoPlay?: boolean;
  qualityOptions?: string[]; audioOptions?: string[]; selectedQuality?: string; selectedAudio?: string;
  onQualityChange?: (q: string) => void; onAudioChange?: (a: string) => void;
  intro?: { start: number; end: number }; outro?: { start: number; end: number };
  localPath?: string;
  poster?: string;
}

export default function VideoPlayer({
  streamUrl, slug, episodeId, isFetchingStream, streamFetchError, onRetry,
  episodes, currentEp, onEpisodeSelect, onEnded, onProgress, autoPlay = true,
  qualityOptions = [], audioOptions = [], selectedQuality, selectedAudio,
  onQualityChange, onAudioChange, intro, outro, localPath, poster
}: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const hlsRef       = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctrlTimer    = useRef<ReturnType<typeof setTimeout>>();
  const saveTimer    = useRef<ReturnType<typeof setInterval>>();
  const tapTimer     = useRef<ReturnType<typeof setTimeout>>();
  const tapCount     = useRef(0);
  const hlsLoadedRef = useRef(false);

  const { getProgress, setProgress } = useProgressStore();
  const toast = useToast();

  const [playing,    setPlaying]    = useState(false);
  const [buffering,  setBuffering]  = useState(true);
  const [current,    setCurrent]    = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [volume,     setVolume]     = useState(1);
  const [muted,      setMuted]      = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCtrl,   setShowCtrl]   = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const indicatorTimer = useRef<NodeJS.Timeout>();
  const touchStartRef  = useRef<{x:number, y:number, type:string|null, axisLocked: 'x'|'y'|null}>({ x:0, y:0, type:null, axisLocked: null });
  const activeEpRef    = useRef<HTMLButtonElement>(null);
  const [isLocked,   setIsLocked]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [dlRes, setDlRes] = useState('720P');
  const [dlSub, setDlSub] = useState('English');
  const [skipAnim,   setSkipAnim]   = useState<{ dir: 'fwd' | 'bck', targetTime: number } | null>(null);
  const [indicator,  setIndicator]  = useState<{ type: 'volume' | 'brightness', value: number } | null>(null);
  const [errMsg,     setErrMsg]     = useState('');
  const [clickFlash, setClickFlash] = useState(false);
  const [continuePrompt, setContinuePrompt] = useState<{time:number}|null>(null);
  const [swipeSeek,  setSwipeSeek]  = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  // Use scrubTime if dragging, otherwise use actual current time
  const displayCurrent = isScrubbing ? scrubTime : current;
  const pct = duration > 0 ? (displayCurrent / duration) * 100 : 0;

  // ── Controls auto-hide ─────────────────────────────────────────────────────
  const showControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => {
      setShowCtrl(false);
    }, 3500);
  }, []);

  const handleMouseMove = useCallback(() => {
    if (!showCtrl) showControls();
    else {
      clearTimeout(ctrlTimer.current);
      ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3500);
    }
  }, [showCtrl, showControls]);

  // ── Skip animation ─────────────────────────────────────────────────────────
  const flashSkip = useCallback((dir: 'fwd' | 'bck', targetTime: number) => {
    setSkipAnim({ dir, targetTime });
    setTimeout(() => setSkipAnim(null), 800);
  }, []);

  // ── Seek ───────────────────────────────────────────────────────────────────
  const skipTime = useCallback((sec: number, showFlash = true) => {
    const v = videoRef.current; if (!v) return;
    const target = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
    v.currentTime = target;
    if (showFlash) flashSkip(sec > 0 ? 'fwd' : 'bck', target);
    showControls();
  }, [flashSkip, showControls]);

  // ── Toggle play/pause ──────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
    showControls();
  }, [showControls]);

  // ── Progress bar seek ──────────────────────────────────────────────────────
  const seekBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current; if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }, [duration]);

  // ── Volume ─────────────────────────────────────────────────────────────────
  const changeVol = useCallback((val: number) => {
    const v = videoRef.current; if (!v) return;
    v.volume = val; v.muted = val === 0;
    setVolume(val); setMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  }, []);

  const toggleFS = useCallback(async () => {
    if (!document.fullscreenElement) {
      try { await containerRef.current?.requestFullscreen(); } catch {}
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch(e) {}
    } else {
      try { await document.exitFullscreen(); } catch {}
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch(e) {}
    }
  }, []);

  // ── Picture-in-Picture ──────────────────────────────────────────────────────
  const togglePiP = useCallback(async () => {
    const v = videoRef.current; if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        // Must wait for metadata to be loaded (readyState >= 1) before requesting PiP
        if (v.readyState < 1) {
          await new Promise<void>((resolve, reject) => {
            const onMeta = () => { v.removeEventListener('loadedmetadata', onMeta); resolve(); };
            const onErr  = () => { v.removeEventListener('error', onErr); reject(new Error('Video failed to load')); };
            v.addEventListener('loadedmetadata', onMeta);
            v.addEventListener('error', onErr);
            setTimeout(() => { v.removeEventListener('loadedmetadata', onMeta); reject(new Error('PiP timeout')); }, 5000);
          });
        }
        await v.requestPictureInPicture();
      }
    } catch (err) { console.error('PiP error', err); }
  }, []);

  const takeScreenshot = useCallback(async () => {
    const v = videoRef.current; if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    try {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg');
      link.download = `AniVerse_Screenshot_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Screenshot downloaded', 'success');
    } catch (e) {
      toast('Failed to save screenshot', 'error');
    }
  }, []);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      const v = videoRef.current;
      switch (e.code) {
        case 'Space': e.preventDefault(); v?.paused ? v.play().catch(()=>{}) : v?.pause(); showControls(); break;
        case 'ArrowRight': e.preventDefault(); skipTime(10); break;
        case 'ArrowLeft':  e.preventDefault(); skipTime(-10); break;
        case 'ArrowUp':    e.preventDefault(); if(v){ v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); } break;
        case 'ArrowDown':  e.preventDefault(); if(v){ v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); } break;
        case 'KeyF': toggleFS(); break;
        case 'KeyM': toggleMute(); break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [skipTime, toggleFS, toggleMute, showControls]);

  const handleTap = useCallback((side: 'left' | 'right' | 'center') => {
    if (isLocked) return;
    tapCount.current++;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (tapCount.current >= 2 && side !== 'center') {
        // Double tap: skip forward/back
        skipTime(side === 'right' ? 10 : -10);
      } else {
        // Single tap: pure toggle — show if hidden, hide if shown
        setShowCtrl(prev => !prev);
      }
      tapCount.current = 0;
    }, 280);
  }, [skipTime, isLocked]);

  const handleTouchStart = (e: React.TouchEvent, type: 'left' | 'right' | 'center') => {
    if (isLocked) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, type, axisLocked: null };
    setSwipeSeek(null);
  };

  const showIndicator = useCallback((type: 'volume' | 'brightness', value: number) => {
    setIndicator({ type, value });
    clearTimeout(indicatorTimer.current);
    indicatorTimer.current = setTimeout(() => setIndicator(null), 1500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isLocked) return;
    const start = touchStartRef.current;
    if (!start.type) return;
    const dx = e.touches[0].clientX - start.x;
    const dy = start.y - e.touches[0].clientY; // positive when swiping up

    if (!start.axisLocked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        start.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      } else {
        return; // wait for clear intent
      }
    }

    if (start.axisLocked === 'x') {
      // Horizontal swipe to seek (works ONLY from center zone)
      if (start.type === 'center') {
        const v = videoRef.current;
        if (v) {
          const offset = (dx / 150) * 60; // adjust sensitivity
          let newTime = v.currentTime + offset;
          newTime = Math.max(0, Math.min(v.duration || 0, newTime));
          setSwipeSeek(newTime);
        }
      }
    } else if (start.axisLocked === 'y') {
      // Vertical swipe for brightness/volume (only on left/right zones)
      if (start.type === 'left') {
        setBrightness(b => {
          const newB = Math.max(0.1, Math.min(1, b + (dy > 0 ? 0.03 : -0.03)));
          showIndicator('brightness', Math.round(newB * 100));
          return newB;
        });
        start.y = e.touches[0].clientY;
      } else if (start.type === 'right') {
        const v = videoRef.current;
        if (v) {
          const newVol = Math.max(0, Math.min(1, v.volume + (dy > 0 ? 0.03 : -0.03)));
          v.volume = newVol;
          setVolume(newVol);
          showIndicator('volume', Math.round(newVol * 100));
        }
        start.y = e.touches[0].clientY;
      }
    }
  }, [showIndicator, isLocked, skipTime]);

  const handleTouchEnd = () => {
    if (swipeSeek !== null && videoRef.current) {
      videoRef.current.currentTime = swipeSeek;
      setSwipeSeek(null);
      showControls();
    }
    touchStartRef.current.type = null;
  };

  // ── Load HLS script dynamically then attach video ─────────────────────────
  const attachHls = useCallback((url: string) => {
    const v = videoRef.current; if (!v) return;
    setErrMsg(''); setBuffering(true); setCurrent(0); setDuration(0); setPlaying(false);

    // destroy previous instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const init = () => {
      const Hls = window.Hls;
      // Restore saved position
      const savedEntry = getProgress(slug, episodeId);
      const startTime = savedEntry && savedEntry.currentTime > 10 ? savedEntry.currentTime : 0;

      const startPlayback = () => {
        setBuffering(false);
        if (startTime > 5) setContinuePrompt({ time: startTime });
        if (autoPlay) v.play().catch(() => {});
      };

      if (Hls?.isSupported()) {
        // Exact same config as the friend's iframe — this is the key to stability
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: false,
          progressive: false,
          testBandwidth: false,
          abrEwmaDefaultEstimate: 500000,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
        hls.on(Hls.Events.BUFFER_STALLED, () => setBuffering(true));
        hls.on(Hls.Events.BUFFER_APPENDING, () => setBuffering(false));
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 1000);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setErrMsg('Stream failed. Try another episode.');
          }
        });
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = url;
        v.addEventListener('loadedmetadata', startPlayback, { once: true });
      } else {
        setErrMsg('HLS not supported in this browser.');
      }
    };

    if (window.Hls) { init(); return; }
    if (hlsLoadedRef.current) { setTimeout(init, 50); return; }
    hlsLoadedRef.current = true;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
    s.onload = init;
    document.head.appendChild(s);
  }, [slug, episodeId, getProgress, autoPlay]);

  // ── Wire video events ──────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onPlay     = () => setPlaying(true);
    const onPause    = () => setPlaying(false);
    const onWaiting  = () => setBuffering(true);
    const onPlaying  = () => setBuffering(false);
    const onTimeupdate = () => {
      setCurrent(v.currentTime);
      onProgress?.(v.currentTime, v.duration || 0);
    };
    const onDurationchange = () => setDuration(v.duration || 0);
    const onEnded_ = () => onEnded?.();
    v.addEventListener('play',           onPlay);
    v.addEventListener('pause',          onPause);
    v.addEventListener('waiting',        onWaiting);
    v.addEventListener('playing',        onPlaying);
    v.addEventListener('timeupdate',     onTimeupdate);
    v.addEventListener('durationchange', onDurationchange);
    v.addEventListener('ended',          onEnded_);
    return () => {
      v.removeEventListener('play',           onPlay);
      v.removeEventListener('pause',          onPause);
      v.removeEventListener('waiting',        onWaiting);
      v.removeEventListener('playing',        onPlaying);
      v.removeEventListener('timeupdate',     onTimeupdate);
      v.removeEventListener('durationchange', onDurationchange);
      v.removeEventListener('ended',          onEnded_);
    };
  }, [onProgress, onEnded]);

  // ── Load stream when URL changes ───────────────────────────────────────────
  useEffect(() => {
    if (localPath) {
      const t = setTimeout(() => attachHls(''), 200); // URL ignored for localPath
      return () => clearTimeout(t);
    }
    if (!streamUrl || isFetchingStream) return;
    const t = setTimeout(() => attachHls(streamUrl), 200);
    return () => clearTimeout(t);
  }, [streamUrl, isFetchingStream, attachHls, localPath]);

  // ── Auto-scroll active episode ─────────────────────────────────────────────
  useEffect(() => {
    if (showEpisodes && activeEpRef.current) {
      activeEpRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [showEpisodes]);

  // ── Native MP4 playback & HLS init ─────────────────────────────────────────────────
  useEffect(() => {
    saveTimer.current = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused && v.currentTime > 5) setProgress(slug, episodeId, v.currentTime, v.duration || 0);
    }, 5000);
    return () => clearInterval(saveTimer.current);
  }, [slug, episodeId, setProgress]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    if (hlsRef.current) hlsRef.current.destroy();
    clearInterval(saveTimer.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video select-none overflow-hidden"
      style={{ cursor: showCtrl ? 'default' : 'none' }}
    >
      {/* Video element — always mounted, never recreated */}
      <video
        ref={videoRef}
        preload="metadata"
        poster={poster}
        className={`w-full h-full absolute inset-0 z-0 bg-black object-${resizeMode}`}
        playsInline
        style={{ filter: `brightness(${brightness})` }}
      />

      {/* Mobile tap zones */}
      <div className="absolute top-0 left-0 bottom-14 w-[20%] z-10" 
        onClick={() => handleTap('left')}
        onTouchStart={e => handleTouchStart(e, 'left')}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd} />
      <div className="absolute top-0 right-0 bottom-14 w-[20%] z-10" 
        onClick={() => handleTap('right')}
        onTouchStart={e => handleTouchStart(e, 'right')}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd} />

      {/* Center click area — single tap = play/pause flash, drag = seek */}
      <div className="absolute top-0 left-[20%] right-[20%] bottom-14 z-10 flex items-center justify-center"
        onTouchStart={e => handleTouchStart(e, 'center')}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => handleTap('center')}>
      </div>

      {/* Center Controls Overlay */}
      <AnimatePresence>
        {showCtrl && !isLocked && !buffering && !errMsg && !streamFetchError && (
          <motion.div
            key="center-controls"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center gap-8 z-20 pointer-events-none"
          >
            {/* Rewind */}
            <button onClick={(e) => { e.stopPropagation(); skipTime(-10, false); }} className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-black/70 transition-all border border-white/10">
              <RotateCcw size={24} className="text-white" />
            </button>
            
            {/* Play/Pause */}
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-16 h-16 rounded-full bg-s5/90 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-s4 transition-all border border-white/10 shadow-2xl">
              {playing ? <Pause size={28} className="text-white" /> : <Play size={28} fill="white" className="text-white ml-1" />}
            </button>
            
            {/* Fast Forward */}
            <button onClick={(e) => { e.stopPropagation(); skipTime(10, false); }} className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-black/70 transition-all border border-white/10">
              <RotateCw size={24} className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume/Brightness Indicator */}
      <AnimatePresence>
        {indicator && (
          <motion.div initial={{ opacity: 0, x: indicator.type === 'volume' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: indicator.type === 'volume' ? 20 : -20 }} transition={{ duration: 0.2 }}
            className={`absolute top-1/3 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-md w-14 h-36 rounded-2xl shadow-2xl border border-white/10 ${indicator.type === 'volume' ? 'right-6' : 'left-6'}`}>
            {indicator.type === 'volume' ? <Volume2 size={22} className="text-white mb-3" /> : <Sun size={22} className="text-white mb-3" />}
            <div className="h-14 w-1.5 bg-white/20 rounded-full mb-3 flex flex-col justify-end overflow-hidden">
              <div className="w-full bg-s5 rounded-full transition-all" style={{ height: `${indicator.value}%` }} />
            </div>
            <span className="text-white font-bold text-[10px]">{indicator.value}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Scrub Indicator */}
      <AnimatePresence>
        {swipeSeek !== null && duration > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-2xl border border-white/10">
              <span className="text-white font-bold font-mono text-lg">{formatTime(swipeSeek)} / {formatTime(duration)}</span>
              <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-s5" style={{ width: `${(swipeSeek / duration) * 100}%` }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Animation Overlay (+10 / -10) */}
      <AnimatePresence>
        {skipAnim && (
          <motion.div
            key={`skip-${skipAnim.dir}-${skipAnim.targetTime}`}
            initial={{ opacity: 0, scale: 0.8, x: skipAnim.dir === 'fwd' ? 20 : -20 }}
            animate={{ opacity: 1, scale: 1, x: skipAnim.dir === 'fwd' ? 40 : -40 }}
            exit={{ opacity: 0, scale: 1.2, x: skipAnim.dir === 'fwd' ? 60 : -60 }}
            transition={{ duration: 0.4 }}
            className={`absolute top-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center ${skipAnim.dir === 'fwd' ? 'right-1/4' : 'left-1/4'}`}
          >
            <div className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              {skipAnim.dir === 'fwd' ? <RotateCw size={28} className="text-white" /> : <RotateCcw size={28} className="text-white" />}
            </div>
            <span className="text-white font-black text-xl drop-shadow-md">
              {skipAnim.dir === 'fwd' ? '+10s' : '-10s'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buffering spinner */}
      {(buffering || isFetchingStream) && !errMsg && !streamFetchError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Loader2 size={48} className="text-s5 animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {(errMsg || streamFetchError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/95 z-50 text-center px-6">
          <span className="text-5xl">⚠️</span>
          <p className="text-white text-sm max-w-md">{streamFetchError || errMsg}</p>
          <button onClick={() => { setErrMsg(''); onRetry?.(); }} className="px-6 py-2.5 rounded-full bg-s5 text-white font-bold hover:bg-s4 transition-all">Retry</button>
        </div>
      )}

      {/* Continue watching prompt */}
      <AnimatePresence>
        {continuePrompt && !isLocked && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-4 z-40 bg-s1/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Saved Progress</span>
              <span className="text-white text-sm font-bold">Continue from {formatTime(continuePrompt.time)}?</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <button onClick={() => { videoRef.current && (videoRef.current.currentTime = continuePrompt.time); setContinuePrompt(null); }}
                className="px-4 py-1.5 bg-s5 text-white rounded-lg text-xs font-bold hover:bg-s4 transition-colors">Resume</button>
              <button onClick={() => setContinuePrompt(null)} className="p-1.5 text-white/50 hover:text-white bg-white/5 rounded-lg"><X size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Intro / Outro buttons */}
      <AnimatePresence>
        {!isLocked && intro && current >= intro.start && current <= intro.end && (
          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = intro.end; }}
            className="absolute bottom-20 right-4 z-40 px-5 py-2.5 bg-s1/95 backdrop-blur-md border border-s5/50 rounded-full text-sm font-bold text-s5 hover:bg-s2 shadow-2xl flex items-center gap-2 transition-all hover:scale-105">
            <SkipForward size={16} /> Skip Intro
          </motion.button>
        )}
        {!isLocked && outro && current >= outro.start && current <= outro.end && (
          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = outro.end; }}
            className="absolute bottom-20 right-4 z-40 px-5 py-2.5 bg-s1/95 backdrop-blur-md border border-s5/50 rounded-full text-sm font-bold text-s5 hover:bg-s2 shadow-2xl flex items-center gap-2 transition-all hover:scale-105">
            <SkipForward size={16} /> Skip Outro
          </motion.button>
        )}
      </AnimatePresence>

      {/* Settings overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-16 right-4 z-50 w-64 bg-[#0a1216]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <span className="text-sm font-bold text-white">SETTINGS</span>
              <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-5">
              {qualityOptions.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Quality</span>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {qualityOptions.map(q => (
                      <button key={q} onClick={() => onQualityChange?.(q)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${selectedQuality === q ? 'bg-s5 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {audioOptions.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Audio</span>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {audioOptions.map(a => (
                      <button key={a} onClick={() => onAudioChange?.(a)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${selectedAudio === a ? 'bg-s5 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>{a}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Resize</span>
                <button onClick={() => setResizeMode(m => m === 'contain' ? 'cover' : m === 'cover' ? 'fill' : 'contain')}
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase transition-all bg-white/5 text-white hover:bg-white/10">
                  {resizeMode}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setShowDownload(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 w-[90%] max-w-sm flex flex-col items-center text-center shadow-2xl">
              <h2 className="text-white font-bold text-xl mb-1">Download Episode {currentEp?.num || '??'}</h2>
              <p className="text-white/50 text-xs font-semibold mb-6 line-clamp-1">{currentEp?.title || slug}</p>
              
              <div className="w-full text-left mb-4">
                <p className="text-white/70 text-xs font-bold mb-2">Select Resolution</p>
                <div className="flex gap-2">
                  {['480P', '720P', '1080P'].map(res => (
                     <button key={res} onClick={() => setDlRes(res)}
                       className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors ${dlRes === res ? 'bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]' : 'border-white/10 text-white hover:bg-white/5'}`}>
                       {res}
                     </button>
                  ))}
                </div>
              </div>

              <div className="w-full text-left mb-6">
                <p className="text-white/70 text-xs font-bold mb-2">Select Subtitle</p>
                <div className="flex gap-2">
                  {['None', 'English'].map(sub => (
                     <button key={sub} onClick={() => setDlSub(sub)}
                       className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors ${dlSub === sub ? 'bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]' : 'border-white/10 text-white hover:bg-white/5'}`}>
                       {sub}
                     </button>
                  ))}
                </div>
              </div>

              <button onClick={() => {
                setShowDownload(false);
                const isAPK = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
                if (isAPK) {
                  // APK: native download → hidden .nomedia storage → shows in in-app Download Library
                  import('@/lib/nativeDownload').then(({ default: AniverseDownload }) => {
                    AniverseDownload.startDownload({
                      url: streamUrl,
                      filename: `${slug}-ep${currentEp?.num || episodeId}`,
                      animeSlug: slug,
                      epId: episodeId,
                      title: currentEp?.title || `Episode ${currentEp?.num || episodeId}`,
                      cover: poster || '',
                      epNum: currentEp?.num || 0,
                      epTitle: currentEp?.title || `Episode ${currentEp?.num || episodeId}`,
                      animeTitle: slug,
                    });
                    toast('Download started — check Library tab', 'info');
                  });
                } else {
                  // Web: browser download → saves to phone root Downloads folder, open with VLC etc.
                  const a = document.createElement('a');
                  a.href = streamUrl;
                  a.download = `${slug}-ep${currentEp?.num || episodeId}.mp4`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  toast('Downloading to your device Downloads folder', 'success');
                }
              }} className="w-full py-3.5 bg-[#FFD700] hover:bg-[#F0C800] text-black font-black rounded-xl text-sm transition-colors shadow-[0_4px_14px_rgba(255,215,0,0.4)]">
                Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episodes drawer */}
      <AnimatePresence>
        {showEpisodes && episodes && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 bottom-0 w-72 bg-black/85 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
              <span className="font-bold text-sm text-white flex items-center gap-2"><List size={16} /> EPISODES</span>
              <button onClick={() => setShowEpisodes(false)} className="text-white/50 hover:text-white bg-white/5 p-1.5 rounded-lg"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto ep-scroll p-2">
              {episodes.map(ep => {
                const active = ep.id === currentEp?.id;
                return (
                  <button key={ep.id} ref={active ? activeEpRef : null} onClick={() => { onEpisodeSelect?.(ep); setShowEpisodes(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${active ? 'bg-s5/20 border border-s5/30' : 'hover:bg-white/5 border border-transparent'}`}>
                    <div className="w-14 h-9 rounded-lg bg-white/5 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {ep.thumbnail
                        ? <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <span className="text-[9px] font-mono font-bold text-white/40">EP {ep.num}</span>}
                      {active && <div className="absolute inset-0 bg-s5/20 flex items-center justify-center"><Play size={12} fill="white" className="text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[9px] font-mono font-bold mb-0.5 ${active ? 'text-s5' : 'text-white/40'}`}>EP {ep.num}</div>
                      <div className={`text-xs font-medium line-clamp-1 ${active ? 'text-white' : 'text-white/70'}`}>{ep.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls bar */}
      {!isLocked && (
        <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 z-40 transition-opacity duration-300 ${showCtrl ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.9) 0%, transparent 100%)' }}
          onClick={e => e.stopPropagation()}>

        {/* Progress bar */}
        <div className="h-1.5 hover:h-2.5 transition-all mb-3 relative rounded-full bg-white/20 cursor-pointer group flex items-center">
          <div className="absolute inset-y-0 left-0 bg-s5 rounded-full pointer-events-none" style={{ width: `${pct}%` }} />
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none" style={{ left: `calc(${pct}% - 7px)` }} />
          <input 
            type="range" min={0} max={duration || 100} step="0.1" value={displayCurrent}
            onPointerDown={() => {
              setIsScrubbing(true);
              setScrubTime(current);
            }}
            onPointerUp={(e) => {
              setIsScrubbing(false);
              const v = videoRef.current;
              if (v) v.currentTime = parseFloat(e.currentTarget.value);
            }}
            onPointerCancel={() => setIsScrubbing(false)}
            onMouseUp={(e) => {
              setIsScrubbing(false);
              const v = videoRef.current;
              if (v) v.currentTime = parseFloat(e.currentTarget.value);
            }}
            onTouchEnd={(e) => {
              setIsScrubbing(false);
              const v = videoRef.current;
              if (v) v.currentTime = parseFloat(e.currentTarget.value);
            }}
            onInput={(e) => {
              const val = parseFloat(e.currentTarget.value);
              setScrubTime(val);
              if (videoRef.current) videoRef.current.currentTime = val;
            }}
            onChange={(e) => {
              const val = parseFloat(e.currentTarget.value);
              setScrubTime(val);
              if (videoRef.current) videoRef.current.currentTime = val;
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-1">
            <button onClick={togglePlay} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
              {playing ? <Pause size={20} /> : <Play size={20} fill="white" />}
            </button>
            <button onClick={() => skipTime(-10, false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
              <SkipBack size={18} />
            </button>
            <button onClick={() => skipTime(10, false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
              <SkipForward size={18} />
            </button>
            <button onClick={toggleMute} className="w-9 h-9 hidden sm:flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={e => changeVol(parseFloat(e.target.value))}
              className="w-16 hidden sm:block accent-s5 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
            <span className="text-white/70 text-[11px] font-mono ml-1">{formatTime(displayCurrent)} / {formatTime(duration)}</span>
          </div>

          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {episodes && episodes.length > 0 && (
              <button onClick={() => { setShowEpisodes(v => !v); setShowSettings(false); setShowDownload(false); }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showEpisodes ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}>
                <List size={15} /> Episodes
              </button>
            )}
            <button onClick={() => { setShowSettings(v => !v); setShowEpisodes(false); setShowDownload(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showSettings ? 'bg-s5 text-white' : 'hover:bg-white/10 text-white/90'}`}>
              <Settings size={15} /> <span className="hidden sm:inline">Settings</span>
            </button>
            <button onClick={() => { setShowDownload(true); setShowSettings(false); setShowEpisodes(false); }} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors" title="Download">
              <Download size={18} />
            </button>
            <button onClick={() => setIsLocked(true)} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
              <Lock size={18} />
            </button>
            <button onClick={takeScreenshot} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors" title="Screenshot">
              <Camera size={18} />
            </button>
            <button onClick={togglePiP} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors" title="Picture in Picture">
              <PictureInPicture2 size={18} />
            </button>
            <button onClick={toggleFS} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Locked Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-transparent"
            onClick={(e) => { e.stopPropagation(); setShowCtrl(true); clearTimeout(ctrlTimer.current); ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3000); }}>
            <AnimatePresence>
              {showCtrl && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={(e) => { e.stopPropagation(); setIsLocked(false); }}
                  className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
                  <Unlock size={28} className="text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
