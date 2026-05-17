'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Play, SkipForward, Loader2, MessageSquare, Heart, Bookmark, Share2, ChevronLeft, List, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';
import { animeAPI, downloadAPI } from '@/lib/api';
import { extractAnimeData, extractEpisode } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useWatchlistStore } from '@/store/watchlistStore';

const ANIMAPI_BASE = 'https://animapi.ayohost.site';

export default function WatchPage({ params, searchParams }: { params: { slug: string; episode: string }, searchParams: { title?: string, ep?: string } }) {
  const { slug, episode } = params;
  const initialTitle = searchParams.title || '';
  const initialEpNum = searchParams.ep ? Number(searchParams.ep) : 0;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const { add: addDownload } = useDownloadStore();
  const { trackEpisode } = useWatchlistStore();

  const [anime, setAnime] = useState<ReturnType<typeof extractAnimeData> | null>(
    initialTitle ? { slug, title: initialTitle, cover: '', banner: '', description: '', genres: [], score: 0, episodes: 0, status: '', year: '', type: '' } as any : null
  );
  const [episodes, setEpisodes] = useState<ReturnType<typeof extractEpisode>[]>([]);
  const [currentEp, setCurrentEp] = useState<ReturnType<typeof extractEpisode> | null>(
    initialEpNum ? { id: episode, num: initialEpNum, title: `Episode ${initialEpNum}`, thumbnail: '' } : null
  );
  const [streamUrl, setStreamUrl] = useState('');
  const [loadStream, setLoadStream] = useState(true);
  const [streamErr, setStreamErr] = useState('');
  const [showEpList, setShowEpList] = useState(false);
  const [qualityOptions, setQualityOptions] = useState<string[]>(['1080', '720', '480', '360']);
  const [audioOptions, setAudioOptions] = useState<string[]>(['jpn', 'eng']);
  const [selectedQuality, setSelectedQuality] = useState('1080');
  const [selectedAudio, setSelectedAudio] = useState('jpn');

  // Fetch anime details
  useEffect(() => {
    animeAPI.getDetail(slug).then(({ data }) => {
      const raw = data.data || data.anime || data;
      if (raw) {
        const info = extractAnimeData(raw);
        // Always prefer the URL title param (it's the human-readable name)
        if (initialTitle && info.title === 'Unknown Anime') {
          info.title = initialTitle;
        }
        setAnime(info);
      }
    }).catch(() => {
      // Fallback: use the title from URL params
      if (initialTitle) {
        setAnime({ slug, title: initialTitle, cover: '', banner: '', description: '', genres: [], score: 0, episodes: 0, status: '', year: '', type: '', in_watchlist: false });
      }
    });
  }, [slug, initialTitle]);

  // Fetch episodes
  useEffect(() => {
    animeAPI.getEpisodes(slug, initialTitle || anime?.title || '').then(({ data }) => {
      const raw = data.episodes || data.data || data.results || (Array.isArray(data) ? data : []);
      const eps = raw.map((ep: Record<string, unknown>, i: number) => extractEpisode(ep, i));
      setEpisodes(eps);
      // Find the current episode by session ID or episode number
      let found = eps.find((e: ReturnType<typeof extractEpisode>) => e.id === episode);
      if (!found) {
        const epNum = Number(episode);
        if (!isNaN(epNum)) {
          found = eps.find((e: ReturnType<typeof extractEpisode>) => e.num === epNum);
        }
      }
      if (!found) found = eps[0];
      if (found) {
        setCurrentEp(found);
        if (found.id !== episode) {
          window.history.replaceState({}, '', `/watch/${slug}/${found.id}?title=${encodeURIComponent(anime?.title || initialTitle)}&ep=${found.num}`);
        }
      }
    }).catch(() => { });
  }, [slug, episode, anime?.title, initialTitle]);

  // ── STREAMING: Use your friend's iframe player logic ──────────────────────
  const fetchStream = useCallback(async (ep: ReturnType<typeof extractEpisode>) => {
    setLoadStream(true); setStreamErr(''); setStreamUrl('');
    try {
      // Normalize quality: strip 'p', strip 'best' -> use empty string so API picks best
      const q = selectedQuality.replace(/p$/i, '').replace('best', '1080');
      const { data } = await animeAPI.getStream(ep.id, slug, q, selectedAudio);
      // Prefer proxy_m3u8 if the API provides it, fallback to stream_url or url
      let url: string = data.proxy_m3u8 || data.stream_url || data.url || data.hls || data.link || data.source || '';

      if (!url) throw new Error('Video server returned no stream link — try another episode');

      // If it's a relative path (like an iframe token), prepend base URL
      if (url.startsWith('/')) {
        url = `${ANIMAPI_BASE}${url}`;
      }

      setStreamUrl(url);
    } catch (e: any) {
      console.error('Stream Fetch Error:', e);
      setStreamErr(e.message || 'Video source unavailable');
    } finally { setLoadStream(false); }
  }, [slug, selectedQuality, selectedAudio]);

  useEffect(() => {
    if (currentEp) fetchStream(currentEp);
  }, [currentEp, fetchStream]);

  // Fetch available qualities — only updates the OPTIONS LIST, never triggers a stream reload
  useEffect(() => {
    if (!currentEp) return;
    animeAPI.getStreamQualities(currentEp.id, slug)
      .then(({ data }) => {
        const streams = data.streams || data.qualities || [];
        if (Array.isArray(streams) && streams.length > 0) {
          const quals = [...new Set(streams.map((s: any) => String(s.quality || s).replace(/p$/i, '')))];
          const auds = [...new Set(streams.map((s: any) => String(s.audio || 'jpn')))];
          if (quals.length) {
            setQualityOptions(quals);
            // Only fix selection if current choice isn't available (don't re-trigger stream)
            setSelectedQuality(prev => quals.includes(prev) ? prev : (quals.includes('1080') ? '1080' : quals[0]));
          }
          if (auds.length) {
            setAudioOptions(auds);
            // Only fix audio if current choice isn't available
            setSelectedAudio(prev => auds.includes(prev) ? prev : (auds.includes('jpn') ? 'jpn' : auds[0]));
          }
        }
      })
      .catch(() => {
        setQualityOptions(['1080', '720', '480', '360']);
        setAudioOptions(['jpn', 'eng']);
      });
  }, [currentEp, slug]);

  // Track episode in watchlist store
  useEffect(() => {
    if (anime && currentEp) {
      trackEpisode(slug, anime.title, anime.cover, currentEp.id, currentEp.num, currentEp.title, 0);
      document.title = `EP ${currentEp.num} — ${anime.title} — AniVerse`;
    }
  }, [currentEp, anime]);

  const switchEp = (ep: ReturnType<typeof extractEpisode>) => {
    setCurrentEp(ep);
    window.history.replaceState({}, '', `/watch/${slug}/${ep.id}?title=${encodeURIComponent(anime?.title || initialTitle)}&ep=${ep.num}`);
    setShowEpList(false);
  };

  const handleEnded = () => {
    const i = episodes.findIndex(e => e.id === currentEp?.id);
    if (i >= 0 && i < episodes.length - 1) {
      const next = episodes[i + 1];
      toast(`Playing EP ${next.num}`, 'info');
      setTimeout(() => switchEp(next), 1200);
    }
  };

  const handleProgress = useCallback((currentTime: number, duration: number) => {
    if (!anime || !currentEp || !duration) return;
    const pct = Math.round((currentTime / duration) * 100);
    trackEpisode(slug, anime.title, anime.cover, currentEp.id, currentEp.num, currentEp.title, pct);
  }, [anime, currentEp, slug, trackEpisode]);

  const [downloadProgress, setDownloadProgress] = useState<{ downloading: boolean; progress: number; name: string }>({
    downloading: false,
    progress: 0,
    name: '',
  });

  const downloadCurrent = async () => {
    if (!currentEp || !anime) return;

    const downloadName = `${anime.title.replace(/[^a-zA-Z0-9-_\. ]/g, '')}-EP${currentEp.num}.mp4`;
    setDownloadProgress({ downloading: true, progress: 0, name: downloadName });

    const triggerDownload = async (url: string) => {
      if (Capacitor.isNativePlatform()) {
        try {
          toast('Starting native download...', 'info');
          const status = await Filesystem.requestPermissions();
          if (status.publicStorage !== 'granted') {
            throw new Error('Storage permission denied');
          }
          window.location.assign(url);
          setDownloadProgress({ downloading: false, progress: 100, name: downloadName });
          setTimeout(() => setDownloadProgress({ downloading: false, progress: 0, name: '' }), 2000);
        } catch (err: any) {
          toast(err.message || 'Native download failed', 'error');
          setDownloadProgress({ downloading: false, progress: 0, name: '' });
        }
      } else {
        window.location.assign(url);
        setDownloadProgress({ downloading: false, progress: 100, name: downloadName });
        setTimeout(() => setDownloadProgress({ downloading: false, progress: 0, name: '' }), 2000);
      }
    };

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const pollJob = async (jobId: string) => {
      const start = Date.now();
      while (Date.now() - start < 120000) {
        const { data } = await downloadAPI.getJobStatus(jobId);
        const status = String(data?.status || data?.state || '').toLowerCase();
        const progress = Number(data?.progress ?? data?.percentage ?? data?.percent ?? 0) || 0;
        setDownloadProgress((prev) => ({ ...prev, progress: Math.max(prev.progress, Math.min(100, progress)) }));

        if (['done', 'finished', 'completed'].includes(status)) {
          return downloadAPI.getJobFile(jobId);
        }

        if (['failed', 'error'].includes(status)) {
          throw new Error(data?.error || `Download ${status}`);
        }

        await wait(2000); // Poll every 2 seconds per friend's spec
      }
      throw new Error('Download timed out');
    };

    try {
      setDownloadProgress((prev) => ({ ...prev, progress: 10 }));

      const payload = {
        anime_slug: slug,
        episode_session: currentEp.id,
        anime_title: anime.title,
        episode_number: currentEp.num,
        quality: selectedQuality.replace('p', ''),
        audio: selectedAudio,
      };

      setDownloadProgress((prev) => ({ ...prev, progress: 30 }));

      const { data } = await downloadAPI.createJob(payload);
      const jobId = data?.job_id || data?.download_id || data?.id || data?.job?.id || data?.jobId;
      if (!jobId) throw new Error('Download job creation failed');

      setDownloadProgress((prev) => ({ ...prev, progress: 40 }));
      const fileUrl = await pollJob(jobId);

      setDownloadProgress((prev) => ({ ...prev, progress: 95 }));
      triggerDownload(fileUrl);

      const saved = await addDownload({
        anime_slug: slug,
        anime_title: anime.title,
        anime_cover: anime.cover,
        episode_num: currentEp.num,
        episode_id: currentEp.id,
        episode_title: currentEp.title,
      }, !!user);

      toast(`Download started: ${downloadName}`, 'success');
      if (saved.success && !saved.duplicate) {
        toast('Added to Library', 'success');
      }
    } catch (e: any) {
      setDownloadProgress({ downloading: false, progress: 0, name: '' });
      toast(e.message || 'Unable to start download', 'error');
    }
  };

  const nextEp = (() => {
    const i = episodes.findIndex(e => e.id === currentEp?.id);
    return i >= 0 && i < episodes.length - 1 ? episodes[i + 1] : null;
  })();

  // Determine if the stream URL is an iframe player URL
  const isIframeSource = streamUrl.includes('/api/player') || streamUrl.includes('/player?token=') || streamUrl.includes('/embed');

  return (
    <div className="min-h-screen bg-s0">
      {/* Mobile ep drawer */}
      <AnimatePresence>
        {showEpList && (
          <motion.div key="drawer" className="fixed inset-0 z-[100] lg:hidden flex justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-s0/90 backdrop-blur-sm" onClick={() => setShowEpList(false)} />
            <motion.div className="relative w-72 bg-s1 border-l border-[var(--border)] flex flex-col h-full"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-display font-bold text-sm text-s4">EPISODES</span>
                <button onClick={() => setShowEpList(false)}><X size={16} className="text-s3" /></button>
              </div>
              <EpList episodes={episodes} current={currentEp} onSelect={switchEp} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Player area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-s1/80 border-b border-[var(--border)] shrink-0">
            <Link href={`/anime/${slug}?title=${encodeURIComponent(anime?.title || initialTitle)}`}
              className="flex items-center gap-1.5 text-s4 hover:text-s5 transition-colors text-sm">
              <ChevronLeft size={15} />Back
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-s5 truncate">{anime?.title || '…'}</p>
              {currentEp && <p className="text-[10px] text-s3 truncate">EP {currentEp.num} — {currentEp.title}</p>}
            </div>
            <button onClick={() => setShowEpList(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-s2 border border-[var(--border)] text-xs font-bold text-s4">
              <List size={13} />Episodes
            </button>
          </div>

          {/* Video */}
          <div className="bg-black relative group/player">
            {/* Removed outside settings overlay as requested */}

            {isIframeSource && !loadStream && !streamErr ? (
              <iframe
                src={streamUrl}
                title="AniVerse Player"
                className="w-full aspect-video"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              />
            ) : (
              <VideoPlayer
                streamUrl={streamUrl} slug={slug}
                episodeId={currentEp?.id || episode}
                isFetchingStream={loadStream}
                streamFetchError={streamErr}
                onRetry={() => currentEp && fetchStream(currentEp)}
                episodes={episodes}
                currentEp={currentEp}
                onEpisodeSelect={switchEp}
                onEnded={handleEnded}
                onProgress={handleProgress}
                autoPlay
                qualityOptions={qualityOptions}
                audioOptions={audioOptions}
                selectedQuality={selectedQuality}
                selectedAudio={selectedAudio}
                onQualityChange={setSelectedQuality}
                onAudioChange={setSelectedAudio}
              />
            )}

            {/* Mobile Side Arrow to open Episodes Drawer */}
            <button
              onClick={() => setShowEpList(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 lg:hidden bg-s1/80 backdrop-blur-md border border-r-0 border-[var(--border)] p-2 rounded-l-xl text-s4 hover:text-s5 shadow-lg flex items-center justify-center translate-x-1 group-hover/player:translate-x-0 transition-transform"
              aria-label="Show Episodes"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Info below player */}
          <div className="p-4 md:p-6 bg-s0 flex-1">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              {/* Header section */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-black text-xl md:text-2xl text-s5 leading-tight">{anime?.title || 'Loading…'}</h1>
                  <p className="text-sm font-medium text-s4 mt-1">
                    {currentEp ? `Episode ${currentEp.num} — ${currentEp.title}` : 'Loading…'}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0 mt-2 md:mt-0">
                  <button onClick={downloadCurrent}
                    disabled={downloadProgress.downloading}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-s1 border border-[var(--border)] text-sm font-bold text-s4 hover:text-s5 hover:bg-s2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                    <Download size={16} />
                    {downloadProgress.downloading ? 'Downloading...' : 'Save Ep'}
                  </button>
                  {nextEp && (
                    <button onClick={() => switchEp(nextEp)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-s5 to-s4 text-s0 text-sm font-bold hover:opacity-90 transition-all shadow-md">
                      <SkipForward size={16} />Next EP
                    </button>
                  )}
                </div>
              </div>

              {/* Download Progress */}
              {downloadProgress.downloading && (
                <div className="p-4 rounded-2xl bg-s1 border border-s5/30 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-s5/5 animate-pulse" />
                  <div className="relative flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Loader2 size={18} className="text-s5 animate-spin" />
                      <span className="text-sm text-s5 font-bold">Downloading {downloadProgress.name}</span>
                    </div>
                    <span className="text-sm font-mono text-s4 font-bold">{downloadProgress.progress}%</span>
                  </div>
                  <div className="relative w-full bg-s0 rounded-full h-2.5 overflow-hidden border border-[var(--border)]">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-s5 to-s4 transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Synopsis */}
              {anime?.description && (
                <div className="p-4 rounded-2xl bg-s1/50 border border-[var(--border-light)]">
                  <h3 className="text-xs font-bold text-s3 uppercase tracking-wider mb-2">Synopsis</h3>
                  <p className="text-sm text-s4 leading-relaxed">{anime.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop episode sidebar */}
        <aside className="hidden lg:flex flex-col w-72 border-l border-[var(--border)] bg-s1/80">
          <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
            <span className="font-display font-bold text-sm text-s4">EPISODES</span>
            {episodes.length > 0 && <span className="text-s3 text-xs ml-2">({episodes.length})</span>}
          </div>
          <EpList episodes={episodes} current={currentEp} onSelect={switchEp} />
        </aside>
      </div>
    </div>
  );
}

function EpList({ episodes, current, onSelect }: {
  episodes: ReturnType<typeof extractEpisode>[];
  current: ReturnType<typeof extractEpisode> | null;
  onSelect: (ep: ReturnType<typeof extractEpisode>) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto ep-scroll">
      {episodes.map(ep => {
        const active = ep.id === current?.id;
        return (
          <button key={ep.id} onClick={() => onSelect(ep)}
            className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[rgba(74,92,106,0.12)] text-left transition-all hover:bg-s2/50 ${active ? 'bg-s2/60 border-l-2 border-l-s5' : ''
              }`}>
            <div className="w-16 h-10 rounded bg-s2 overflow-hidden shrink-0 flex items-center justify-center">
              {ep.thumbnail ? (
                <img src={ep.thumbnail} alt="" className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="text-[9px] font-mono font-bold text-s3">EP {ep.num}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-mono text-s4 font-bold mb-0.5">EP {ep.num}</div>
              <div className="text-xs font-medium text-s5 line-clamp-2 leading-tight">{ep.title}</div>
            </div>
          </button>
        );
      })}
      {episodes.length === 0 && <div className="p-4 text-sm text-s3">No episodes found.</div>}
    </div>
  );
}
