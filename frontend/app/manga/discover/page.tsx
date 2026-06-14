'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Clock, Flame, Search, ChevronRight, BookOpen } from 'lucide-react';
import { mangaService, type AniMangaCard } from '@/lib/manga/mangaService';
import { useInView } from 'react-intersection-observer';

const SORTS = [
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'popular',  label: 'Popular',  icon: TrendingUp },
  { key: 'score',    label: 'Top Rated',icon: Star },
  { key: 'new',      label: 'Newest',   icon: Clock },
];

const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'];

function MangaCard({ manga, index = 0 }: { manga: AniMangaCard; index?: number }) {
  const statusLabel: Record<string, string> = { RELEASING: 'Ongoing', FINISHED: 'Complete', NOT_YET_RELEASED: 'Upcoming' };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.4) }}>
      <Link href={`/manga/${manga.id}`} className="block group">
        <div className="relative overflow-hidden rounded-xl bg-[#0d0505] border border-red-950/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgba(225,29,72,0.15)] group-hover:border-red-800/30">
          <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
            {manga.coverImage ? (
              <img src={manga.coverImage} alt={manga.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-950/20">
                <BookOpen size={28} className="text-red-800" />
              </div>
            )}
            {manga.score > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 text-yellow-400 text-[10px] font-bold">
                <Star size={9} fill="currentColor" /> {(manga.score/10).toFixed(1)}
              </div>
            )}
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-wider mb-0.5 truncate">{manga.genres[0] || manga.format}</p>
            <h3 className="text-xs font-bold text-slate-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">{manga.title}</h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-slate-600">{statusLabel[manga.status] || manga.status}</span>
              {manga.chapters && <span className="text-[9px] font-mono text-slate-600">{manga.chapters}ch</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-red-950/10">
      <div className="skeleton" style={{ aspectRatio: '2/3' }} />
      <div className="p-2.5 space-y-1.5">
        <div className="skeleton h-2 w-16 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const initialSort = searchParams.get('sort') || 'trending';
  const initialGenre = searchParams.get('genre') || '';

  const [sort, setSort] = useState(initialSort);
  const [genre, setGenre] = useState(initialGenre);
  const [items, setItems] = useState<AniMangaCard[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const { ref: loaderRef, inView } = useInView({ threshold: 0.1, rootMargin: '200px' });

  const fetchData = useCallback(async (currentPage: number, reset: boolean) => {
    setLoading(true);
    try {
      let results: AniMangaCard[];
      if (genre) {
        results = await mangaService.getByGenre(genre, currentPage, 24);
      } else {
        switch (sort) {
          case 'popular':  results = await mangaService.getPopular(currentPage, 24); break;
          case 'score':    results = await mangaService.getTopRated(currentPage, 24); break;
          case 'new':      results = await mangaService.getNewReleases(currentPage, 24); break;
          default:         results = await mangaService.getTrending(currentPage, 24); break;
        }
      }
      if (results.length < 24) setHasMore(false);
      setItems(prev => reset ? results : [...prev, ...results.filter(r => !prev.some(p => p.id === r.id))]);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [sort, genre]);

  // Reset on sort/genre change
  useEffect(() => {
    setItems([]); setPage(1); setHasMore(true);
    fetchData(1, true);
  }, [sort, genre]);

  // Infinite scroll
  useEffect(() => {
    if (inView && !loading && hasMore && page > 1) {
      fetchData(page, false);
    }
  }, [inView]);

  const loadNext = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchData(next, false);
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #0f0204 0%, #06141B 40%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 h-14 flex items-center gap-3 bg-black/80 backdrop-blur-xl border-b border-red-950/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
            DISCOVER
          </span>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Sort Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {SORTS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setSort(key); setGenre(''); }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                sort === key && !genre
                  ? 'bg-red-600 text-white shadow-[0_0_14px_rgba(225,29,72,0.4)]'
                  : 'bg-red-950/30 text-slate-400 border border-red-900/20 hover:bg-red-900/30'
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Genre Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setGenre('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              !genre ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300'
            }`}>
            All
          </button>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                genre === g
                  ? 'bg-red-600 text-white'
                  : 'text-slate-500 border border-red-950/30 hover:text-red-400 hover:border-red-800/40'
              }`}>
              {g}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((m, i) => <MangaCard key={m.id} manga={m} index={i % 24} />)}
          {loading && Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && !loading && (
          <div ref={loaderRef} className="h-20 flex items-center justify-center mt-4">
            <button onClick={loadNext} className="px-6 py-2 rounded-full text-xs font-bold text-red-400 border border-red-900/30 hover:bg-red-900/20 transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
