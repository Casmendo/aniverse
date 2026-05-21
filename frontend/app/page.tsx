'use client';
import { useEffect, useState } from 'react';
import { Clock, Zap, History, X, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import HeroSlider   from '@/components/HeroSlider';
import AnimeSection from '@/components/AnimeSection';
import { animeAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useDownloadStore  } from '@/store/downloadStore';
import { useAuthStore } from '@/store/authStore';

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

  const [airing,     setAiring]     = useState<Record<string,unknown>[]>([]);
  const [popular,    setPopular]    = useState<Record<string,unknown>[]>([]);
  const [genres,     setGenres]     = useState<string[]>(GENRES);
  const [activeGenre,setActiveGenre]= useState('');
  const [genreItems, setGenreItems] = useState<Record<string,unknown>[]>([]);
  const [loadingA,   setLoadingA]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);
  const [loadingG,   setLoadingG]   = useState(false);

  useEffect(() => {
    const hardcodedAiring = ['witch hat atelier', 'dr stone', 're zero', 'classroom of the elite', 'wistoria season 2'];
    Promise.all(hardcodedAiring.map(q => animeAPI.search(q).then(r => {
      const arr = Array.isArray(r.data) ? r.data : r.data.results || r.data.data || r.data.anime || [];
      return arr.length > 0 ? arr[0] : null;
    }).catch(() => null))).then(results => {
      const manualAiring = results.filter(Boolean) as Record<string,unknown>[];
      animeAPI.getAiring().then(({data}) => {
        const fetchAiring = Array.isArray(data) ? data : data.results || data.data || data.anime || [];
        const merged = [...manualAiring, ...fetchAiring];
        // Deduplicate by session/id to prevent React duplicate key warnings
        const seen = new Set<string>();
        const unique = merged.filter(item => {
          const key = String((item as any).session || (item as any).id || Math.random());
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAiring(unique);
      }).catch(() => setAiring(manualAiring)).finally(() => setLoadingA(false));
    });

    const hardcodedPopular = [
      'wistoria', 'jack of all trades', 'eminence in shadow', 'dr stone', 'one piece',
      'vinland saga', 'black clover', 'demon slayer', 'attack on titan', 'death note',
      'one punch man', 'fullmetal alchemist', 'jujutsu kaisen', 'tokyo ghoul',
      'sword art online', 'hunter x hunter'
    ];
    Promise.all(hardcodedPopular.map(q => animeAPI.search(q).then(r => {
      const arr = Array.isArray(r.data) ? r.data : r.data.results || r.data.data || r.data.anime || [];
      return arr.length > 0 ? arr[0] : null;
    }).catch(() => null))).then(results => {
      const seen = new Set<string>();
      const unique = (results.filter(Boolean) as Record<string,unknown>[]).filter(item => {
        const key = String((item as any).session || (item as any).id || Math.random());
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPopular(unique);
    }).finally(() => setLoadingP(false));

    animeAPI.getGenres().then(({data}) => {
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.genres) ? data.genres : [];
      if (list.length) setGenres(list);
      if (!activeGenre && list.length) setActiveGenre(list[0]);
    }).catch(() => {}).finally(() => setLoadingG(false));
  }, []);

  useEffect(() => {
    if (!activeGenre) return;
    setLoadingG(true);
    animeAPI.getGenre(activeGenre).then(({data}) => {
      const items = Array.isArray(data)
        ? data
        : data.results || data.data || data.anime || [];
      if (items.length > 0) setGenreItems(items);
      else throw new Error('Empty');
    }).catch(() => {
      // Fallback: search by genre name
      animeAPI.search(activeGenre).then(({data}) => {
        const items = Array.isArray(data)
          ? data
          : data.results || data.data || data.anime || [];
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
                    <img src={r.cover||`https://picsum.photos/seed/${r.slug}/300/450`} alt={r.title}
                      className="w-full h-full object-cover"
                      onError={e=>{(e.target as HTMLImageElement).src=`https://picsum.photos/seed/${r.slug}/300/450`;}} />
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

      {/* Airing Now */}
      <AnimeSection title="Airing Now" loading={loadingA} items={airing} watchedSlugs={watchedSlugs}
        icon={<Clock size={14} className="text-s4" />}
        onDownload={handleDownload} onWatchlist={handleWatchlist} />

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
