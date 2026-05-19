'use client';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Settings, X, List, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  streamUrl:   string;
  slug:        string;
  episodeId:   string;
  isFetchingStream?: boolean;
  streamFetchError?: string;
  onRetry?: () => void;
  episodes?: any[];
  currentEp?: any;
  onEpisodeSelect?: (ep: any) => void;
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
  streamUrl, slug, episodeId, isFetchingStream, streamFetchError, onRetry,
  episodes, currentEp, onEpisodeSelect, onEnded, onProgress, autoPlay=true,
  qualityOptions=[], audioOptions=[], selectedQuality, selectedAudio,
  onQualityChange, onAudioChange
}: Props) {
  
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Setup postMessage listener for tracking progress if the iframe supports it
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Very basic postMessage parsing in case the iframe provider sends time updates
      // The exact format depends on the provider (e.g. jwplayer, vidstream, etc)
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'timeupdate' && data.currentTime && data.duration) {
          onProgress?.(data.currentTime, data.duration);
        }
        if (data && data.event === 'ended') {
          onEnded?.();
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProgress, onEnded]);

  return (
    <div className="relative bg-black w-full aspect-video select-none overflow-hidden group">
      
      {/* Iframe Container */}
      {!isFetchingStream && !streamFetchError && streamUrl ? (
         <iframe
            ref={iframeRef}
            src={streamUrl}
            className="w-full h-full border-0 absolute inset-0 z-0"
            allowFullScreen
            allow="autoplay; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-presentation"
         />
      ) : null}

      {/* Settings & Episodes Buttons (Floating Top Right) */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {episodes && episodes.length > 0 && (
          <button onClick={() => setShowEpisodes(!showEpisodes)} className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10 shadow-lg">
            <List size={16}/> <span className="hidden sm:inline">Episodes</span>
          </button>
        )}
        <button onClick={() => setShowSettings(!showSettings)} className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10 shadow-lg">
          <Settings size={16}/> <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {isFetchingStream && !streamFetchError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black">
          <Loader2 size={48} className="text-s5 animate-spin drop-shadow-md" />
          <p className="text-white text-sm font-bold tracking-wide mt-4 drop-shadow-lg">Loading Stream...</p>
        </div>
      )}

      {/* Error Overlay */}
      {streamFetchError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-s0/95 backdrop-blur-md text-center px-6 z-50">
          <span className="text-5xl">⚠️</span>
          <p className="text-white font-medium text-sm max-w-md">{streamFetchError}</p>
          <button onClick={(e)=>{e.stopPropagation(); onRetry?.();}} className="px-6 py-2.5 mt-2 rounded-full bg-s5 text-white font-bold shadow-lg hover:bg-s4 transition-all">
            Retry Connection
          </button>
        </div>
      )}

      {/* Settings Overlay Menu */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-16 right-4 z-50 w-64 bg-[#0a1216]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4"
            onClick={e => e.stopPropagation()}>
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

      {/* In-Player Episodes Drawer */}
      <AnimatePresence>
        {showEpisodes && episodes && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 bottom-0 w-72 bg-black/80 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
              <span className="font-display font-bold text-sm text-white flex items-center gap-2"><List size={16}/> EPISODES</span>
              <button onClick={() => setShowEpisodes(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto ep-scroll p-2">
              {episodes.map(ep => {
                const active = ep.id === currentEp?.id;
                return (
                  <button key={ep.id} onClick={() => { onEpisodeSelect?.(ep); setShowEpisodes(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${active ? 'bg-s5/20 border border-s5/30 shadow-sm' : 'hover:bg-white/5 border border-transparent'}`}>
                    <div className="w-14 h-9 rounded-lg bg-white/5 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {ep.thumbnail ? (
                        <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-white/40">EP {ep.num}</span>
                      )}
                      {active && <div className="absolute inset-0 bg-s5/20 flex items-center justify-center"><Play size={12} fill="white" className="text-white"/></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[9px] font-mono font-bold mb-0.5 ${active ? 'text-s5' : 'text-white/40'}`}>EP {ep.num}</div>
                      <div className={`text-xs font-medium line-clamp-1 leading-tight ${active ? 'text-white' : 'text-white/70'}`}>{ep.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
