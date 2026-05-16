'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Loader2, Settings, X, Sun } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useProgressStore } from '@/store/progressStore';
import { motion, AnimatePresence } from 'framer-motion';

declare global { interface Window { Hls: any; } }

interface Props {
  streamUrl:   string;
  slug:        string;
  episodeId:   string;
  onEnded?:    () => void;
  onProgress?: (currentTime:number, duration:number) => void;
  autoPlay?:   boolean;
  qualityOptions?: string[];
  audioOptions?: string[];
  selectedQuality?: string;
  selectedAudio?: string;
  onQualityChange?: (q: string) => void;
  onAudioChange?: (a: string) => void;
}

export default function VideoPlayer({ 
  streamUrl, slug, episodeId, onEnded, onProgress, autoPlay=true,
  qualityOptions=[], audioOptions=[], selectedQuality, selectedAudio,
  onQualityChange, onAudioChange
}: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const hlsRef      = useRef<any>(null);
  const containerRef= useRef<HTMLDivElement>(null);
  const ctrlTimeout = useRef<ReturnType<typeof setTimeout>>();
  const saveInterval= useRef<ReturnType<typeof setInterval>>();
  const clickTimeout= useRef<ReturnType<typeof setTimeout>>();

  const { getProgress, setProgress } = useProgressStore();

  const [playing,   setPlaying]   = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [error,     setError]     = useState('');
  const [volume,    setVolume]    = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [muted,     setMuted]     = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [fullscreen,setFullscreen]= useState(false);
  const [showCtrl,  setShowCtrl]  = useState(true);
  const [hlsReady,  setHlsReady]  = useState(false);
  const [hlsFailed, setHlsFailed] = useState(false);
  
  // Custom Overlays
  const [showSettings, setShowSettings] = useState(false);
  const [indicator, setIndicator] = useState<{type: 'volume'|'brightness', val: number, active: boolean}>({type: 'volume', val: 1, active: false});
  const indicatorTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Load HLS.js
  useEffect(() => {
    if (window.Hls) {
      setHlsReady(true);
      return;
    }
    const s = document.createElement('script');
    s.src   = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    s.async = true;
    s.onload = () => setHlsReady(true);
    s.onerror = () => setHlsFailed(true);
    document.head.appendChild(s);
    return () => { if (s.parentNode) s.parentNode.removeChild(s); };
  }, []);

  const loadVideo = useCallback((url: string) => {
    const v = videoRef.current;
    if (!v || !url) return;
    setError(''); setBuffering(true); setPlaying(false);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current=null; }
    v.pause(); v.removeAttribute('src'); v.load();

    const startPlayback = () => {
      setBuffering(false);
      const saved = getProgress(slug, episodeId);
      if (saved && saved.currentTime>10 && saved.currentTime<saved.duration-15) v.currentTime=saved.currentTime;
      if (autoPlay) v.play().catch(()=>{});
    };

    const Hls = window.Hls;
    const nativeHls = v.canPlayType('application/vnd.apple.mpegurl');
    if (!Hls && !nativeHls && url.includes('.m3u8')) {
      if (!hlsReady && !hlsFailed) {
        setBuffering(true);
        return;
      }
    }
    if (!Hls?.isSupported?.() && nativeHls) {
      v.src=url;
      v.addEventListener('loadedmetadata', startPlayback, {once:true});
      v.addEventListener('error', ()=>setError('Playback failed'), {once:true});
      return;
    }
    if (Hls?.isSupported?.()) {
      const hls = new Hls({ enableWorker:true, backBufferLength:30, maxBufferLength:60 });
      hlsRef.current = hls;
      hls.loadSource(url); hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
      hls.on(Hls.Events.BUFFER_STALLED,  ()=>setBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDING,()=>setBuffering(false));
      hls.on(Hls.Events.ERROR, (_:any, data:any) => {
        if (data.fatal) {
          if (data.type===Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type===Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setError('Playback failed — try another episode');
        }
      });
    } else setError('HLS not supported');
  }, [slug, episodeId, getProgress, autoPlay]);

  useEffect(() => {
    if (!streamUrl) return;
    const t = setTimeout(()=>loadVideo(streamUrl), 400);
    return ()=>clearTimeout(t);
  }, [streamUrl, loadVideo, hlsReady, hlsFailed]);

  useEffect(()=>()=>{
    if(hlsRef.current) hlsRef.current.destroy();
    clearInterval(saveInterval.current);
  },[]);

  // Auto-save progress
  useEffect(() => {
    saveInterval.current = setInterval(()=>{
      const v=videoRef.current;
      if(v&&v.currentTime>0&&v.duration>0){
        setProgress(slug,episodeId,v.currentTime,v.duration);
        onProgress?.(v.currentTime,v.duration);
      }
    }, 5000);
    return ()=>clearInterval(saveInterval.current);
  }, [slug,episodeId,setProgress,onProgress]);

  // Events
  const onPlay_=()=>{setPlaying(true);setBuffering(false);};
  const onPause_=()=>setPlaying(false);
  const onWaiting_=()=>setBuffering(true);
  const onCanPlay_=()=>setBuffering(false);
  const onTime_=()=>{const v=videoRef.current;if(!v)return;setCurrent(v.currentTime);if(v.duration)setDuration(v.duration);};
  const onMeta_=()=>{const v=videoRef.current;if(v?.duration)setDuration(v.duration);};
  const onEnded_=()=>{setPlaying(false);const v=videoRef.current;if(v)setProgress(slug,episodeId,v.duration,v.duration);onEnded?.();};

  // Controls visibility
  const showControls=()=>{
    setShowCtrl(true);
    clearTimeout(ctrlTimeout.current);
    if (!showSettings) {
      ctrlTimeout.current=setTimeout(()=>{if(playing)setShowCtrl(false);},3000);
    }
  };

  const togglePlay=()=>{const v=videoRef.current;if(!v)return;v.paused?v.play().catch(()=>{}):v.pause();};
  const seek=(e:React.MouseEvent<HTMLDivElement>)=>{const v=videoRef.current;if(!v||!v.duration)return;const r=e.currentTarget.getBoundingClientRect();v.currentTime=((e.clientX-r.left)/r.width)*v.duration;};
  const skipTime=(s:number)=>{const v=videoRef.current;if(v)v.currentTime=Math.max(0,Math.min(v.duration||Infinity,v.currentTime+s));};
  
  const showIndicator = (type: 'volume'|'brightness', val: number) => {
    setIndicator({type, val, active: true});
    clearTimeout(indicatorTimeout.current);
    indicatorTimeout.current = setTimeout(() => setIndicator(i => ({...i, active: false})), 1500);
  };

  const changeVol=(val:number)=>{
    const v=videoRef.current;if(!v)return;
    const clamped = Math.max(0, Math.min(1, val));
    v.volume=clamped;v.muted=clamped===0;
    setVolume(clamped);setMuted(clamped===0);
    showIndicator('volume', clamped);
  };

  const changeBright=(val:number)=>{
    const clamped = Math.max(0.1, Math.min(2, val));
    setBrightness(clamped);
    showIndicator('brightness', clamped / 2); // Normalize 0-1 for progress bar
  };

  const toggleMute=()=>{const v=videoRef.current;if(!v)return;v.muted=!v.muted;setMuted(v.muted);if(!v.muted&&volume===0)changeVol(0.5);};
  const toggleFS=async()=>{const el=containerRef.current;if(!el)return;if(!document.fullscreenElement){await el.requestFullscreen().catch(()=>{});setFullscreen(true);}else{await document.exitFullscreen().catch(()=>{});setFullscreen(false);}};

  // Touch Swipe Logic
  const touchStart = useRef<{x:number, y:number, vol:number, bright:number}|null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, vol: volume, bright: brightness };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || e.touches.length !== 1) return;
    const dy = touchStart.current.y - e.touches[0].clientY;
    const containerH = containerRef.current?.clientHeight || window.innerHeight;
    const delta = (dy / containerH) * 1.5; // Swipe full screen = 150% change

    if (touchStart.current.x > window.innerWidth / 2) {
      // Right side -> Volume
      changeVol(touchStart.current.vol + delta);
    } else {
      // Left side -> Brightness
      changeBright(touchStart.current.bright + (delta * 2));
    }
  };
  const handleTouchEnd = () => { touchStart.current = null; };

  // Screen Click handling
  const handleScreenClick = (e: React.MouseEvent) => {
    if (showSettings) { setShowSettings(false); return; }
    showControls();
    if (clickTimeout.current) {
      // Double click
      clearTimeout(clickTimeout.current);
      clickTimeout.current = undefined;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        if (e.clientX > rect.left + rect.width * 0.6) skipTime(10);
        else if (e.clientX < rect.left + rect.width * 0.4) skipTime(-10);
        else toggleFS();
      }
    } else {
      // Single click
      clickTimeout.current = setTimeout(() => {
        togglePlay();
        clickTimeout.current = undefined;
      }, 250);
    }
  };

  // Keyboard
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;
      switch(e.key){
        case ' ':case 'k':e.preventDefault();togglePlay();break;
        case 'ArrowRight':skipTime(10);break;
        case 'ArrowLeft':skipTime(-10);break;
        case 'm':toggleMute();break;
        case 'f':toggleFS();break;
        case 'ArrowUp':e.preventDefault();changeVol(Math.min(1,volume+0.1));break;
        case 'ArrowDown':e.preventDefault();changeVol(Math.max(0,volume-0.1));break;
      }
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[playing,volume]);

  useEffect(()=>{
    const h=()=>setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange',h);
    return()=>document.removeEventListener('fullscreenchange',h);
  },[]);

  const pct = duration>0?(current/duration)*100:0;

  return (
    <div ref={containerRef} className="relative bg-black w-full aspect-video select-none overflow-hidden"
      onMouseMove={showControls}
      onMouseLeave={() => !showSettings && setShowCtrl(false)}
      style={{cursor:showCtrl?'default':'none'}}>

      <video ref={videoRef} className="w-full h-full object-contain" playsInline
        style={{ filter: `brightness(${brightness})` }}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onClick={handleScreenClick}
        onPlay={onPlay_} onPause={onPause_} onWaiting={onWaiting_} onCanPlay={onCanPlay_}
        onTimeUpdate={onTime_} onLoadedMetadata={onMeta_} onEnded={onEnded_} />

      {/* Touch Indicators (Volume / Brightness) */}
      <AnimatePresence>
        {indicator.active && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-6 rounded-2xl pointer-events-none z-40">
            {indicator.type === 'volume' ? <Volume2 size={24} className="text-white" /> : <Sun size={24} className="text-white" />}
            <div className="w-2 h-24 bg-white/20 rounded-full overflow-hidden mt-2 relative">
              <div className="absolute bottom-0 left-0 right-0 bg-s5 rounded-full transition-all duration-75" style={{ height: `${indicator.val * 100}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Screen Skip/Play Overlay */}
      <div className={`absolute inset-0 pointer-events-none flex items-center justify-center gap-12 transition-opacity duration-300 z-30 ${showCtrl && !showSettings ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={(e) => {e.stopPropagation(); skipTime(-10);}} className="pointer-events-auto w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-sm transition-all md:hidden">
          <SkipBack size={24} />
        </button>
        <button onClick={(e) => {e.stopPropagation(); togglePlay();}} className="pointer-events-auto w-16 h-16 rounded-full bg-s5/90 hover:bg-s5 flex items-center justify-center text-white backdrop-blur-sm transition-all shadow-lg shadow-s5/20">
          {playing ? <Pause size={32}/> : <Play size={32} fill="white" className="translate-x-0.5"/>}
        </button>
        <button onClick={(e) => {e.stopPropagation(); skipTime(10);}} className="pointer-events-auto w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-sm transition-all md:hidden">
          <SkipForward size={24} />
        </button>
      </div>

      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Loader2 size={48} className="text-s5 animate-spin drop-shadow-md" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-s0/90 text-center px-6 z-50">
          <span className="text-4xl">⚠️</span>
          <p className="text-s4 text-sm">{error}</p>
          <button onClick={()=>{setError('');loadVideo(streamUrl);}}
            className="px-5 py-2 rounded-full bg-s2 border border-[var(--border)] text-sm text-s4 hover:text-s5 transition-all">
            Retry
          </button>
        </div>
      )}

      {/* Settings Overlay Menu */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-16 right-4 z-50 w-64 bg-[#0a1216]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <span className="text-sm font-bold text-white tracking-wide">SETTINGS</span>
              <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white"><X size={16}/></button>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Quality</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {qualityOptions.map(q => (
                    <button key={q} onClick={() => onQualityChange?.(q)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${selectedQuality === q ? 'bg-s5 text-white shadow-md shadow-s5/20' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Audio</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {audioOptions.map(a => (
                    <button key={a} onClick={() => onAudioChange?.(a)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${selectedAudio === a ? 'bg-s5 text-white shadow-md shadow-s5/20' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 transition-opacity duration-300 z-40 ${showCtrl?'opacity-100':'opacity-0 pointer-events-none'}`}
        style={{background:'linear-gradient(0deg,rgba(0,0,0,.85) 0%,transparent 100%)'}}
        onClick={e=>e.stopPropagation()}>

        {/* Progress */}
        <div className="prog-track mb-3 group/track cursor-pointer h-1.5 hover:h-2 transition-all relative rounded-full bg-white/20" onClick={seek}>
          <div className="absolute top-0 left-0 bottom-0 bg-s5 rounded-full" style={{width:`${pct}%`}} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/track:opacity-100 transition-opacity shadow-md" style={{left:`calc(${pct}% - 6px)`}} />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
              {playing ? <Pause size={20}/> : <Play size={20} fill="white"/>}
            </button>
            <button onClick={()=>skipTime(-10)} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
              <SkipBack size={17}/>
            </button>
            <button onClick={toggleMute} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
              {muted||volume===0?<VolumeX size={17}/>:<Volume2 size={17}/>}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted?0:volume}
              onChange={e=>changeVol(parseFloat(e.target.value))}
              className="w-16 hidden sm:block accent-s5 cursor-pointer h-1 bg-white/20 rounded-lg appearance-none" />
            <span className="text-white/70 text-[11px] font-mono ml-2 font-medium tracking-wide">
              {formatTime(current)} <span className="mx-1 opacity-50">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex-1" />

          {/* Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={()=>setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showSettings ? 'bg-s5 text-white' : 'hover:bg-white/10 text-white/90'
              }`}>
              <Settings size={15}/> <span className="hidden sm:inline">Settings</span>
            </button>
            <button onClick={toggleFS} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
              {fullscreen?<Minimize size={17}/>:<Maximize size={17}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
