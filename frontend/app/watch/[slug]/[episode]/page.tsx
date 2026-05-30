'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Play, SkipForward, Loader2, MessageSquare, Heart, Bookmark, Check, Share2, ChevronLeft, List, X } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';
import { animeAPI, downloadAPI } from '@/lib/api';
import { extractAnimeData, extractEpisode } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { processDownload } from '@/lib/downloadService';

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.aniiverse.name.ng';

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
  const [relatedSeries, setRelatedSeries] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [intro, setIntro] = useState<{start:number, end:number}|undefined>(undefined);
  const [outro, setOutro] = useState<{start:number, end:number}|undefined>(undefined);

  // Smart base title extraction for related series search
  const getBaseTitle = (title: string) => title
    .replace(/\s*:\s*.+$/, '')              // Remove ': Subtitle' (SAO: Alicization → SAO)
    .replace(/\s*[-–—]\s*.+/, '')         // Remove ' - Subtitle'
    .replace(/\s+(the\s+)?final\s+(season|part)\s*$/i, '')
    .replace(/\s+(season|part|cour)\s*\d+\s*$/i, '')
    .replace(/\s+\d+(st|nd|rd|th)\s+season\s*$/i, '')
    .replace(/\s+[IVX]{1,5}\s*$/, '')      // Remove trailing roman numerals
    .replace(/\s+\d+\s*$/, '')             // Remove trailing Arabic numbers
    .trim();

  // Fetch anime details
  useEffect(() => {
    animeAPI.getDetail(slug, initialTitle).then(({ data }) => {
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

  // Fetch related series (smart search by base title)
  useEffect(() => {
    const title = anime?.title || initialTitle;
    if (!title) return;
    const query = getBaseTitle(title);
    if (query.length < 2) return;
    animeAPI.search(query).then(({ data }) => {
      const results = data.results || data.data || (Array.isArray(data) ? data : []);
      const filtered = results
        .filter((r: any) => {
          const t = (r.title || r.name || '').toLowerCase();
          return t && t !== title.toLowerCase();
        })
        .slice(0, 20);
      setRelatedSeries(filtered);
    }).catch(() => {});
  }, [anime?.title, initialTitle]);

  // Fetch recommendations from trending (shuffled for variety)
  useEffect(() => {
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
    animeAPI.getTrending().then(({ data }) => {
      const results = data.results || data.data || (Array.isArray(data) ? data : []);
      setRecommendations(shuffle(results).slice(0, 30));
    }).catch(() => {
      animeAPI.getAiring().then(({ data }) => {
        const results = data.results || data.data || (Array.isArray(data) ? data : []);
        setRecommendations(shuffle(results).slice(0, 30));
      }).catch(() => {});
    });
  }, []);

  // ── STREAMING: Use your friend's iframe player logic ──────────────────────
  const fetchStream = useCallback(async (ep: ReturnType<typeof extractEpisode>) => {
    setLoadStream(true); setStreamErr(''); setStreamUrl('');
    try {
      // Normalize quality: strip 'p', strip 'best' -> use empty string so API picks best
      const q = selectedQuality.replace(/p$/i, '').replace('best', '1080');
      const { data } = await animeAPI.getStream(ep.id, slug, q, selectedAudio);
      // Use proxy_m3u8 for our custom HLS player
      let url: string = data.proxy_m3u8 || data.stream_url || data.url || '';
      if (!url) throw new Error('No stream URL found — try another episode.');
      if (url.startsWith('/')) url = `${BACKEND_BASE}${url}`;
      
      setIntro(data.intro);
      setOutro(data.outro);

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
          const quals = Array.from(new Set(streams.map((s: any) => String(s.quality || s).replace(/p$/i, ''))));
          const auds = Array.from(new Set(streams.map((s: any) => String(s.audio || 'jpn'))));
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
      trackEpisode(slug, anime.title, anime.cover || anime.banner || '', currentEp.id, currentEp.num, currentEp.title, 0);
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
    trackEpisode(slug, anime.title, anime.cover || anime.banner || '', currentEp.id, currentEp.num, currentEp.title, pct);
  }, [anime, currentEp, slug, trackEpisode]);

  const toggleEpSelection = (id: string) => {
    setSelectedEpisodes(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const downloadSelected = async () => {
    if (!anime) return;
    const epsToDownload = episodes.filter(ep => selectedEpisodes.includes(ep.id));
    setShowDownloadModal(false);
    setSelectedEpisodes([]);
    for (const ep of epsToDownload) {
      await processDownload(ep, anime, selectedQuality, selectedAudio, toast);
    }
    toast('All selected downloads processed!', 'success');
  };

  const saveEp = async (ep: ReturnType<typeof extractEpisode>) => {
    if (!anime) return;
    await processDownload(ep, anime, selectedQuality, selectedAudio, toast);
  };

  const downloadCurrent = async () => {
    if (!currentEp || !anime) return;
    setShowDownloadModal(false);
    await processDownload(currentEp, anime, selectedQuality, selectedAudio, toast);
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
                <span className="font-display font-bold text-sm text-s4 flex items-center gap-2">
                  EPISODES
                  {Math.max(anime?.episodes || 0, episodes.length) > 0 && (
                    <span className="text-s3 text-xs font-normal bg-s2 px-2 py-0.5 rounded">
                      {Math.max(anime?.episodes || 0, episodes.length) === 1 ? '1 Episode' : `1 - ${Math.max(anime?.episodes || 0, episodes.length)}`}
                    </span>
                  )}
                </span>
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
            ) : (() => {
              const { groups } = useDownloadStore.getState();
              const group = groups.find(g => g.anime_slug === slug);
              const downloadedEp = group?.episodes.find(e => e.episode_id === currentEp?.id || e.episode_num === currentEp?.num);
              
              return (
                <VideoPlayer
                  streamUrl={streamUrl} slug={slug}
                  episodeId={currentEp?.id || episode}
                  localPath={downloadedEp?.localPath}
                  poster={anime?.poster}
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
                intro={intro}
                outro={outro}
                />
              );
            })()}

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
                  <button onClick={() => setShowDownloadModal(true)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-s1 border border-[var(--border)] text-sm font-bold text-s4 hover:text-s5 hover:bg-s2 transition-all shadow-sm">
                    <Download size={16} />
                    Download EP
                  </button>
                  {nextEp && (
                    <button onClick={() => switchEp(nextEp)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-s5 to-s4 text-s0 text-sm font-bold hover:opacity-90 transition-all shadow-md">
                      <SkipForward size={16} />Next EP
                    </button>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              {anime?.description && (
                <div className="p-4 rounded-2xl bg-s1/50 border border-[var(--border-light)]">
                  <h3 className="text-xs font-bold text-s3 uppercase tracking-wider mb-2">Synopsis</h3>
                  <p className="text-sm text-s4 leading-relaxed">{anime.description}</p>
                </div>
              )}

              {/* Related Seasons / Series */}
              {relatedSeries.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-s4 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-s5 inline-block" />
                    Related Seasons & Movies
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {relatedSeries.map((r: any, i: number) => {
                      const a = extractAnimeData(r);
                      return (
                        <Link key={a.slug || i} href={`/anime/${a.slug}?title=${encodeURIComponent(a.title)}`}
                          className="shrink-0 w-28 group">
                          <div className="w-28 h-40 rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all relative mb-2"
                            style={{ boxShadow: 'var(--shadow-sm)' }}>
                            {a.cover
                              ? <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <div className="w-full h-full flex items-center justify-center"><Play size={20} className="text-s3" /></div>}
                            {a.type && <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-s5/90 text-white uppercase">{a.type}</span>}
                          </div>
                          <p className="text-xs font-semibold text-s4 group-hover:text-s5 transition-colors line-clamp-2 leading-tight">{a.title}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* You May Also Like */}
              {recommendations.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-sm font-bold text-s4 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-s5 inline-block" />
                    You May Also Like
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {recommendations.map((r: any, i: number) => {
                      const a = extractAnimeData(r);
                      return (
                        <Link key={a.slug || i} href={`/anime/${a.slug}?title=${encodeURIComponent(a.title)}`}
                          className="shrink-0 w-28 group">
                          <div className="w-28 h-40 rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all relative mb-2"
                            style={{ boxShadow: 'var(--shadow-sm)' }}>
                            {a.cover
                              ? <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <div className="w-full h-full flex items-center justify-center"><Play size={20} className="text-s3" /></div>}
                            {a.type && <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white uppercase">{a.type}</span>}
                          </div>
                          <p className="text-xs font-semibold text-s4 group-hover:text-s5 transition-colors line-clamp-2 leading-tight">{a.title}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop episode sidebar */}
        <aside className="hidden lg:flex flex-col w-72 border-l border-[var(--border)] bg-s1/80">
          <div className="px-4 py-3 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
            <span className="font-display font-bold text-sm text-s4">EPISODES</span>
            {Math.max(anime?.episodes || 0, episodes.length) > 0 && (
              <span className="text-s3 text-[10px] font-bold bg-s2 px-2 py-0.5 rounded border border-[var(--border)]">
                {Math.max(anime?.episodes || 0, episodes.length) === 1 ? '1 EP' : `1 - ${Math.max(anime?.episodes || 0, episodes.length)}`}
              </span>
            )}
          </div>
          <EpList episodes={episodes} current={currentEp} onSelect={switchEp} />
        </aside>
      </div>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-s1 border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <h3 className="font-display font-bold text-lg text-s5">Download Episodes</h3>
                <button onClick={() => setShowDownloadModal(false)} className="text-s3 hover:text-s5"><X size={20} /></button>
              </div>
              
              {anime && (
                <div className="relative w-full h-28 bg-s2 shrink-0">
                  <img src={anime.cover || anime.banner} alt={anime.title} className="w-full h-full object-cover opacity-60" onError={(e) => (e.currentTarget.style.display='none')} />
                  <div className="absolute inset-0 bg-gradient-to-t from-s1 to-transparent flex flex-col justify-end p-4">
                    <span className="font-bold text-sm text-white drop-shadow-md truncate">{anime.title}</span>
                  </div>
                </div>
              )}
              
              <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)] shrink-0 bg-s1/50">
                <span className="text-xs font-bold text-s4 uppercase tracking-widest">Settings</span>
                <div className="flex gap-2">
                  <select value={selectedQuality} onChange={e => setSelectedQuality(e.target.value)}
                    className="bg-s2 border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-s5 outline-none cursor-pointer">
                    {qualityOptions.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)}
                    className="bg-s2 border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-s5 outline-none cursor-pointer uppercase">
                    {audioOptions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 ep-scroll">
                {/* Active Episode Direct Download using the stream URL logic */}
                {currentEp && (
                  <div className="mb-4 pb-4 border-b border-[var(--border)]">
                    <p className="text-xs font-bold text-s4 uppercase tracking-widest px-2 mb-2">Direct Download (MP4)</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-s2/50 border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-s5">EP {currentEp.num}</div>
                        <div className="text-sm text-s4 line-clamp-1">{currentEp.title}</div>
                      </div>
                      <button onClick={downloadCurrent}
                        className="p-2.5 rounded-xl bg-s5 text-white hover:bg-s4 transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs font-bold text-s4 uppercase tracking-widest px-2 mb-2 mt-4">Save to Device</p>
                {episodes.map(ep => {
                  const isSelected = selectedEpisodes.includes(ep.id);
                  return (
                    <div key={ep.id} onClick={() => toggleEpSelection(ep.id)}
                      className={`flex items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-s5/10 border-s5/30' : 'border-transparent hover:bg-s2'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-s5 border-s5' : 'border-s3'}`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-s5' : 'text-s4'}`}>EP {ep.num}</div>
                        <div className="text-sm text-s5 line-clamp-1 font-medium">{ep.title}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); saveEp(ep); }}
                        className="p-2.5 rounded-xl bg-s2 text-s4 hover:bg-s5 hover:text-white transition-all">
                        <Download size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {selectedEpisodes.length > 0 && (
                <div className="p-4 border-t border-[var(--border)] bg-s2">
                  <button onClick={downloadSelected}
                    className="w-full py-3.5 rounded-xl bg-s5 text-white font-bold hover:bg-s4 transition-colors flex items-center justify-center gap-2">
                    <Bookmark size={18} /> Save {selectedEpisodes.length} Selected
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
