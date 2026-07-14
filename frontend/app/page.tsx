'use client';
import { useEffect, useState } from 'react';
import { Clock, Zap, History, X, Download, Sun, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import HeroSlider   from '@/components/HeroSlider';
import AnimeSection from '@/components/AnimeSection';
import { animeAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useDownloadStore  } from '@/store/downloadStore';
import { useAuthStore } from '@/store/authStore';
import { useCacheStore } from '@/store/cacheStore';

const GENRES = [
  'Action','Adventure','Comedy','Drama','Fantasy',
  'Horror','Mecha','Romance','Sci-Fi','Slice of Life',
  'Sports','Supernatural','Thriller','Ecchi','Isekai','Shounen',
];

export default function HomePage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { toggleWatchlist, isInWatchlist, watchlist, recentlyWatched, removeFromHistory } = useWatchlistStore();
  const { add: addDownload } = useDownloadStore();

  const { 
    airing: cachedAiring, popular: cachedPopular, 
    latestReleases: cachedLatest, mostWatched: cachedMostWatched,
    setAiring: cacheAiring, setPopular: cachePopular, 
    setLatestReleases: cacheLatest, setMostWatched: cacheMostWatched 
  } = useCacheStore();

  const [airing,     setAiring]     = useState<Record<string,unknown>[]>(cachedAiring);
  const [popular,    setPopular]    = useState<Record<string,unknown>[]>(cachedPopular);
  const [genres,     setGenres]     = useState<string[]>(GENRES);
  const [activeGenre,setActiveGenre]= useState('');
  const [genreItems, setGenreItems] = useState<Record<string,unknown>[]>([]);
  
  const [loadingA,   setLoadingA]   = useState(cachedAiring.length === 0);
  const [loadingP,   setLoadingP]   = useState(cachedPopular.length === 0);
  const [loadingLR,  setLoadingLR]  = useState(cachedLatest.length === 0);
  const [loadingMW,  setLoadingMW]  = useState(cachedMostWatched.length === 0);
  const [loadingG,   setLoadingG]   = useState(false);
  
  const [latestReleases, setLatestReleases] = useState<Record<string,unknown>[]>(cachedLatest);
  const [mostWatched, setMostWatched] = useState<Record<string,unknown>[]>(cachedMostWatched);

  const [seasonal, setSeasonal] = useState<Record<string,unknown>[]>([]);
  const [loadingSeasonal, setLoadingSeasonal] = useState(true);
  const [schedule, setSchedule] = useState<Record<string,unknown>[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleDay, setScheduleDay] = useState<string>(
    ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
  );

  useEffect(() => {
    animeAPI.getAiring().then(async ({data}) => {
      const arr = Array.isArray(data) ? data : data.results || data.items || data.data || data.anime || [];
      setAiring(arr);
      cacheAiring(arr);
    }).catch(() => {
      if (cachedAiring.length === 0) setAiring([]);
    }).finally(() => setLoadingA(false));

    animeAPI.getRecommended().then(({data}) => {
      const arr = Array.isArray(data) ? data : data.results || data.items || data.data || data.anime || [];
      setLatestReleases(arr);
      cacheLatest(arr);
    }).finally(() => setLoadingLR(false));

    animeAPI.getTrending().then(({data}) => {
      const arr = Array.isArray(data) ? data : data.results || data.items || data.data || data.anime || [];
      setMostWatched(arr);
      cacheMostWatched(arr);
    }).finally(() => setLoadingMW(false));

    animeAPI.getPopular().then(({data}) => {
      const arr = Array.isArray(data) ? data : data.results || data.items || data.data || data.anime || [];
      setPopular(arr);
      cachePopular(arr);
    }).catch(() => {}).finally(() => setLoadingP(false));

    animeAPI.getGenres().then(({data}) => {
      let list = Array.isArray(data)
        ? data
        : Array.isArray(data.genres) ? data.genres : [];
      // Extract string from {id, name, url} objects
      list = list.map((g: any) => g?.id || g?.name || g);
      if (list.length) setGenres(list);
      if (!activeGenre && list.length) setActiveGenre(list[0]);
    }).catch(() => {}).finally(() => setLoadingG(false));

    animeAPI.getSeasonal(new Date().getFullYear(), ['WINTER','SPRING','SUMMER','FALL'][Math.floor((new Date().getMonth() / 12) * 4)]).then(({data}) => {
      const arr = Array.isArray(data) ? data : data.anime || data.results || data.items || data.data || [];
      setSeasonal(arr);
    }).finally(() => setLoadingSeasonal(false));

    animeAPI.getSchedule(scheduleDay).then(({data}) => {
      const arr = Array.isArray(data) ? data : data.schedule || data.results || data.items || data.data || [];
      setSchedule(arr);
    }).finally(() => setLoadingSchedule(false));
  }, []);

  // When scheduleDay changes, fetch new schedule
  useEffect(() => {
    setLoadingSchedule(true);
    animeAPI.getSchedule(scheduleDay).then(({data}) => {
      const arr = Array.isArray(data) ? data : data.schedule || data.results || data.items || data.data || [];
      setSchedule(arr);
    }).finally(() => setLoadingSchedule(false));
  }, [scheduleDay]);

  useEffect(() => {
    if (!activeGenre) return;
    setLoadingG(true);
    animeAPI.getGenre(activeGenre).then(({data}) => {
      const items = Array.isArray(data)
        ? data
        : data.results || data.items || data.data || data.anime || [];
      if (items.length > 0) setGenreItems(items);
      else throw new Error('Empty');
    }).catch(() => {
      // Fallback: search by genre name
      animeAPI.search(activeGenre).then(({data}) => {
        const items = Array.isArray(data)
          ? data
          : data.results || data.items || data.data || data.anime || [];
        setGenreItems(items.length > 0 ? items : []);
      }).catch(() => setGenreItems([]));
    }).finally(() => setLoadingG(false));
  }, [activeGenre]);

  const handleWatchlist = (slug: string, title: string, cover: string) => {
    const added = toggleWatchlist({ slug, title, cover });
    toast(added ? 'Added to watchlist' : 'Removed from watchlist', 'info');
  };

  const handleDownload = async (slug: string, title: string, cover: string) => {
    const result = await addDownload({
      anime_slug:slug, anime_title:title, anime_cover:cover,
      episode_num:1, episode_id:'1', episode_title:'Episode 1',
    }, !!user);
    if (result.duplicate) toast('Already in your library', 'info');
    else if (result.success) toast(`${title} EP 1 saved!`, 'success');
  };

  const watchedSlugs = new Set(watchlist.map(w => w.slug));
  const heroItems    = airing;

  return (
    <>
      {/* Hero */}
      <HeroSlider items={heroItems} />

      {/* Continue Watching */}
      {recentlyWatched.length > 0 && (
        <section className="px-[clamp(16px,4vw,56px)] py-7">
          <div className="flex items-center gap-3 font-display font-bold text-[clamp(.95rem,2.3vw,1.2rem)] text-s5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-s2 flex items-center justify-center border border-[var(--border)] shrink-0">
              <History size={14} className="text-s4" />
            </div>
            Continue Watching
          </div>
          <div className="snap-row">
            {recentlyWatched.slice(0,12).map((r,i) => (
              <motion.div key={r.slug} className="relative group card-wrap flex-shrink-0 bg-s1 overflow-hidden"
                style={{width:'clamp(140px,16vw,180px)'}}
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                transition={{delay:i*0.04,ease:[0.16,1,0.3,1],duration:0.45}}>
                {/* Delete button */}
                <button
                  onClick={(e)=>{e.preventDefault();e.stopPropagation();removeFromHistory(r.slug);}}
                  className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-s0/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  title="Remove">
                  <X size={10} className="text-white"/>
                </button>
                <a href={r.lastEpId ? `/watch/${r.slug}/${r.lastEpId}?title=${encodeURIComponent(r.title)}&ep=${r.lastEpNum}` : `/anime/${r.slug}?title=${encodeURIComponent(r.title)}`}>
                  <div className="relative" style={{aspectRatio:'2/3'}}>
                    <img src={r.cover} alt={r.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  {/* Progress bar at bottom */}
                  {r.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-s2/60">
                      <div className="h-full bg-s5 transition-all" style={{width:`${r.progress}%`}} />
                    </div>
                  )}
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-s0/90 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    {r.lastEpNum > 0 && (
                      <span className="text-[9px] font-mono font-bold text-s4 bg-s0/80 px-1.5 py-0.5 rounded">
                        EP {r.lastEpNum}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-s4 leading-tight line-clamp-2">{r.title}</p>
                </div>
                </a>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="section-line" />

      {/* Seasonal Anime */}
      <AnimeSection title="Seasonal Anime" loading={loadingSeasonal} items={seasonal} watchedSlugs={watchedSlugs}
        icon={<Sun size={14} className="text-s4" />}
        onDownload={handleDownload} onWatchlist={handleWatchlist} />

      {/* Airing Now */}
      <AnimeSection title="Airing Now" loading={loadingA} items={airing} watchedSlugs={watchedSlugs}
        icon={<Clock size={14} className="text-s4" />}
        onDownload={handleDownload} onWatchlist={handleWatchlist} />

      <AnimeSection title="Latest Releases" loading={loadingLR} items={latestReleases} watchedSlugs={watchedSlugs}
        icon={<Zap size={14} className="text-s4" />}
        onDownload={handleDownload} onWatchlist={handleWatchlist} />

      <AnimeSection title="Most Watched" loading={loadingMW} items={mostWatched} watchedSlugs={watchedSlugs}
        icon={<History size={14} className="text-s4" />}
        onDownload={handleDownload} onWatchlist={handleWatchlist} />

      <div className="section-line" />

      {/* Release Schedule */}
      <section className="px-[clamp(16px,4vw,56px)] py-7">
        <div className="flex items-center gap-3 font-display font-bold text-[clamp(.95rem,2.3vw,1.2rem)] text-s5 mb-5">
          <div className="w-7 h-7 rounded-lg bg-s2 flex items-center justify-center border border-[var(--border)] shrink-0">
            <Calendar size={14} className="text-s4" />
          </div>
          Release Schedule
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 ep-scroll mb-2">
          {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => (
            <button key={day} onClick={() => setScheduleDay(day)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                scheduleDay === day ? 'bg-s5 text-s0' : 'bg-s2 text-s4 hover:bg-s3/50'
              }`}>
              {day}
            </button>
          ))}
        </div>
        
        {/* Render schedule items using the same AnimeCard wrap pattern as AnimeSection */}
        <div className="relative">
          <div className="snap-row">
            {loadingSchedule
              ? Array.from({ length: 8 }, (_, i) => <div key={`skeleton-${i}`} className="w-[180px] h-[260px] bg-s2 animate-pulse rounded-xl" />)
              : schedule.length > 0
                ? schedule.map((raw: any, i) => {
                    // Reusing the same props structure as AnimeSection mappings
                    const { extractAnimeData } = require('@/lib/utils');
                    const a = extractAnimeData(raw);
                    // animeAPI schedule might have airingAt/airingTime we could show, but standard AnimeCard is fine
                    return (
                      <div key={`schedule-${a.slug}-${i}`} className="shrink-0 w-[clamp(140px,16vw,180px)]">
                        <Link href={`/anime/${a.slug}?title=${encodeURIComponent(a.title)}`} className="group block">
                          <div className="relative rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all mb-2.5" style={{ aspectRatio: '2/3', boxShadow: 'var(--shadow-sm)' }}>
                            <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            {a.type && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white uppercase">{a.type}</span>}
                            {raw.episode && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-s5 text-s0 uppercase">EP {raw.episode}</span>}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <span className="text-white text-[10px] font-bold">{new Date(raw.airingAt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-s4 group-hover:text-s5 transition-colors line-clamp-2 leading-tight">{a.title}</p>
                        </Link>
                      </div>
                    );
                  })
                : (
                  <div className="w-full min-h-[220px] flex items-center justify-center rounded-3xl border border-dashed border-s2 bg-s0/60 text-s4 text-sm">
                    No schedule data for {scheduleDay}.
                  </div>
                )
            }
          </div>
        </div>
      </section>

      <AnimeSection title="Popular Anime" loading={loadingP} items={popular} watchedSlugs={watchedSlugs}
        icon={<History size={14} className="text-s4" />}
        onDownload={handleDownload} onWatchlist={handleWatchlist} />

      <section className="px-[clamp(16px,4vw,56px)] py-7">
        <div className="flex items-center gap-3 font-display font-bold text-[clamp(.95rem,2.3vw,1.2rem)] text-s5 mb-5">
          <div className="w-7 h-7 rounded-lg bg-s2 flex items-center justify-center border border-[var(--border)] shrink-0">
            <Zap size={14} className="text-s4" />
          </div>
          Genres
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {(genres.length ? genres : GENRES).slice(0,18).map((g,i) => (
            <motion.button key={g}
              initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              transition={{delay:i*0.02,ease:[0.16,1,0.3,1],duration:0.3}}
              onClick={() => setActiveGenre(g)}
              className={`px-4 py-2 rounded-full text-s4 text-xs font-semibold transition-all duration-200 border ${
                activeGenre===g ? 'bg-s5 border-s5 text-s0' : 'bg-s1 border-[var(--border)] hover:bg-s2 hover:text-s5'
              }`}>
              {g}
            </motion.button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-s4 font-semibold">{activeGenre ? `${activeGenre} Anime` : 'Browse by genre'}</p>
              <h2 className="font-display font-bold text-[clamp(1.05rem,2.2vw,1.35rem)] text-s5">Curated picks for {activeGenre || 'you'}</h2>
            </div>
            {loadingG && <span className="text-xs text-s3">Loading…</span>}
          </div>
          <AnimeSection title={activeGenre ? `${activeGenre} Spotlight` : 'Genres'} loading={loadingG} items={genreItems.length ? genreItems : (popular.length ? popular : airing)} watchedSlugs={watchedSlugs}
            icon={<Zap size={14} className="text-s4" />}
            onDownload={handleDownload} onWatchlist={handleWatchlist} />
        {!loadingG && activeGenre && !genreItems.length && (
          <p className="text-sm text-s3 mt-3">Could not load results for {activeGenre}. Please try another genre.</p>
        )}
        </div>
      </section>
    </>
  );
}
