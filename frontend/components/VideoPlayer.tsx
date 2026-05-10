'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useProgressStore } from '@/store/progressStore';

declare global { interface Window { Hls: any; } }

interface Props {
  streamUrl:   string;
  slug:        string;
  episodeId:   string;
  onEnded?:    () => void;
  onProgress?: (currentTime:number, duration:number) => void;
  autoPlay?:   boolean;
}

export default function VideoPlayer({ streamUrl, slug, episodeId, onEnded, onProgress, autoPlay=true }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const hlsRef      = useRef<any>(null);
  const containerRef= useRef<HTMLDivElement>(null);
  const ctrlTimeout = useRef<ReturnType<typeof setTimeout>>();
  const saveInterval= useRef<ReturnType<typeof setInterval>>();

  const { getProgress, setProgress } = useProgressStore();

  const [playing,   setPlaying]   = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [error,     setError]     = useState('');
  const [volume,    setVolume]    = useState(1);
  const [muted,     setMuted]     = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [fullscreen,setFullscreen]= useState(false);
  const [showCtrl,  setShowCtrl]  = useState(true);
  const [subOn,     setSubOn]     = useState(false);
  const [hlsReady,  setHlsReady]  = useState(false);
  const [hlsFailed, setHlsFailed] = useState(false);

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
    ctrlTimeout.current=setTimeout(()=>{if(playing)setShowCtrl(false);},3000);
  };

  const togglePlay=()=>{const v=videoRef.current;if(!v)return;v.paused?v.play().catch(()=>{}):v.pause();};
  const seek=(e:React.MouseEvent<HTMLDivElement>)=>{const v=videoRef.current;if(!v||!v.duration)return;const r=e.currentTarget.getBoundingClientRect();v.currentTime=((e.clientX-r.left)/r.width)*v.duration;};
  const skipTime=(s:number)=>{const v=videoRef.current;if(v)v.currentTime=Math.max(0,Math.min(v.duration||Infinity,v.currentTime+s));};
  const changeVol=(val:number)=>{const v=videoRef.current;if(!v)return;v.volume=val;v.muted=val===0;setVolume(val);setMuted(val===0);};
  const toggleMute=()=>{const v=videoRef.current;if(!v)return;v.muted=!v.muted;setMuted(v.muted);if(!v.muted&&volume===0)changeVol(0.5);};
  const toggleFS=async()=>{const el=containerRef.current;if(!el)return;if(!document.fullscreenElement){await el.requestFullscreen().catch(()=>{});setFullscreen(true);}else{await document.exitFullscreen().catch(()=>{});setFullscreen(false);}};

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
    <div ref={containerRef} className="relative bg-black w-full aspect-video select-none"
      onMouseMove={showControls}
      onClick={()=>{togglePlay();showControls();}}
      onDoubleClick={toggleFS}
      style={{cursor:showCtrl?'default':'none'}}>

      <video ref={videoRef} className="w-full h-full object-contain" playsInline
        onPlay={onPlay_} onPause={onPause_} onWaiting={onWaiting_} onCanPlay={onCanPlay_}
        onTimeUpdate={onTime_} onLoadedMetadata={onMeta_} onEnded={onEnded_} />

      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 size={48} className="text-s4 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-s0/90 text-center px-6">
          <span className="text-4xl">⚠️</span>
          <p className="text-s4 text-sm">{error}</p>
          <button onClick={()=>{setError('');loadVideo(streamUrl);}}
            className="px-5 py-2 rounded-full bg-s2 border border-[var(--border)] text-sm text-s4 hover:text-s5 transition-all">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 transition-opacity duration-300 ${showCtrl?'opacity-100':'opacity-0 pointer-events-none'}`}
        style={{background:'linear-gradient(0deg,rgba(0,0,0,.85) 0%,transparent 100%)'}}
        onClick={e=>e.stopPropagation()}>

        {/* Progress */}
        <div className="prog-track mb-3" onClick={seek}>
          <div className="prog-fill" style={{width:`${pct}%`}} />
          <div className="prog-thumb" style={{left:`${pct}%`}} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
            {playing ? <Pause size={20}/> : <Play size={20} fill="white"/>}
          </button>
          <button onClick={()=>skipTime(-10)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
            <SkipBack size={17}/>
          </button>
          <button onClick={()=>skipTime(10)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
            <SkipForward size={17}/>
          </button>
          <button onClick={toggleMute} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
            {muted||volume===0?<VolumeX size={17}/>:<Volume2 size={17}/>}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={muted?0:volume}
            onChange={e=>changeVol(parseFloat(e.target.value))}
            className="w-16 hidden sm:block" />
          <span className="text-white/70 text-xs font-mono ml-1 whitespace-nowrap">
            {formatTime(current)} / {formatTime(duration)}
          </span>
          <div className="flex-1" />
          <button onClick={()=>setSubOn(!subOn)}
            className={`px-2.5 py-1 rounded text-xs font-display font-bold border transition-all ${
              subOn?'bg-white/20 border-white/40 text-white':'border-white/20 text-white/50 hover:text-white/80'
            }`}>CC</button>
          <button onClick={toggleFS} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white">
            {fullscreen?<Minimize size={17}/>:<Maximize size={17}/>}
          </button>
        </div>
      </div>
    </div>
  );
}
