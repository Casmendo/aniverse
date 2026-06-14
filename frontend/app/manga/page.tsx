'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Star, Clock, Sparkles, ChevronRight, BookOpen } from 'lucide-react';
import { mangaService, type AniMangaCard } from '@/lib/manga/mangaService';
import { useMangaStore } from '@/store/mangaStore';

// ── Manga Card ────────────────────────────────────────────────────────────────
function MangaCard({ manga, index = 0 }: { manga: AniMangaCard; index?: number }) {
  const [imgError, setImgError] = useState(false);
  const isBookmarked = useMangaStore(s => s.isBookmarked(String(manga.id)));

  const statusColor: Record<string, string> = {
    RELEASING: 'bg-green-500/20 text-green-400 border-green-500/30',
    FINISHED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    NOT_YET_RELEASED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const statusLabel: Record<string, string> = {
    RELEASING: 'Ongoing', FINISHED: 'Complete',
    NOT_YET_RELEASED: 'Upcoming', CANCELLED: 'Cancelled', HIATUS: 'Hiatus',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/manga/${manga.id}`} className="block group">
        <div className="relative overflow-hidden rounded-xl bg-[#0d0505] border border-red-950/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgba(225,29,72,0.2)] group-hover:border-red-800/40">
          {/* Cover */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
            {!imgError && manga.coverImage ? (
              <img
                src={manga.coverImage}
                alt={manga.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-950/20">
                <BookOpen size={32} className="text-red-800" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Score badge */}
            {manga.score > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-yellow-400 text-[10px] font-bold">
                <Star size={9} fill="currentColor" /> {(manga.score / 10).toFixed(1)}
              </div>
            )}
            {/* Status badge */}
            <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusColor[manga.status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
              {statusLabel[manga.status] || manga.status}
            </div>
          </div>
          {/* Info */}
          <div className="p-2.5">
            <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-wider mb-0.5 truncate">
              {manga.genres[0] || manga.format}
            </p>
            <h3 className="text-xs font-bold text-slate-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">
              {manga.title}
            </h3>
            {manga.chapters && (
              <p className="text-[10px] font-mono text-slate-600 mt-1">
                {manga.chapters} ch
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-red-950/10">
      <div className="skeleton" style={{ aspectRatio: '2/3' }} />
      <div className="p-2.5 space-y-1.5">
        <div className="skeleton h-2.5 w-16 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

// ── Section Row ───────────────────────────────────────────────────────────────
function Section({
  title, icon: Icon, items, loading, viewAllHref,
}: {
  title: string;
  icon: any;
  items: AniMangaCard[];
  loading: boolean;
  viewAllHref?: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-red-500" />
          <h2 className="font-black text-base text-white uppercase tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
            {title}
          </h2>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="flex items-center gap-1 text-xs font-bold text-red-500/70 hover:text-red-400 transition-colors">
            All <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="snap-row">
          {items.map((m, i) => (
            <div key={m.id} className="snap-col shrink-0 w-[140px] sm:w-[160px]">
              <MangaCard manga={m} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ manga }: { manga: AniMangaCard | null }) {
  if (!manga) return null;
  return (
    <div className="relative w-full h-[45vh] min-h-[300px] mb-8 overflow-hidden rounded-2xl">
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${manga.coverImage})`, filter: 'blur(12px) brightness(0.25) saturate(1.5)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-6 md:p-10">
        <div className="flex items-end gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20, rotateY: 15 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden sm:block w-36 md:w-48 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ aspectRatio: '2/3' }}
          >
            <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-1 min-w-0"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {manga.genres.slice(0, 3).map(g => (
                <span key={g} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">{g}</span>
              ))}
            </div>
            <h1 className="font-black text-white text-2xl md:text-4xl leading-tight mb-3 drop-shadow-lg line-clamp-2" style={{ fontFamily: "'Orbitron', monospace" }}>
              {manga.title}
            </h1>
            {manga.score > 0 && (
              <div className="flex items-center gap-2 mb-5 text-sm font-bold text-yellow-400">
                <Star size={16} fill="currentColor" />
                {(manga.score / 10).toFixed(1)} / 10
                <span className="text-slate-500 font-normal">· {manga.popularity?.toLocaleString()} follows</span>
              </div>
            )}
            <Link
              href={`/manga/${manga.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-red-600 text-white hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(225,29,72,0.5)]"
            >
              <BookOpen size={16} /> Read Now
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MangaHome() {
  const [trending, setTrending] = useState<AniMangaCard[]>([]);
  const [popular, setPopular] = useState<AniMangaCard[]>([]);
  const [topRated, setTopRated] = useState<AniMangaCard[]>([]);
  const [newReleases, setNewReleases] = useState<AniMangaCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      mangaService.getTrending(1, 20),
      mangaService.getPopular(1, 20),
      mangaService.getTopRated(1, 20),
      mangaService.getNewReleases(1, 16),
    ]).then(([t, p, tr, nr]) => {
      if (t.status === 'fulfilled') setTrending(t.value);
      if (p.status === 'fulfilled') setPopular(p.value);
      if (tr.status === 'fulfilled') setTopRated(tr.value);
      if (nr.status === 'fulfilled') setNewReleases(nr.value);
    }).finally(() => setLoading(false));
  }, []);

  const heroBanner = trending[0] || null;

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #0f0204 0%, #06141B 40%, #06141B 100%)' }}>
      {/* Top brand bar */}
      <div className="sticky top-0 z-40 px-5 h-14 flex items-center bg-black/80 backdrop-blur-xl border-b border-red-950/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.4)]">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-black text-lg tracking-wider text-white" style={{ fontFamily: "'Orbitron', monospace" }}>
            MANGA<span className="text-red-500">VERSE</span>
          </span>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-6">
        {/* Hero */}
        {!loading && <HeroBanner manga={heroBanner} />}
        {loading && <div className="skeleton rounded-2xl h-[45vh] min-h-[300px] mb-8" />}

        {/* Sections */}
        <Section title="Trending Now" icon={Flame} items={trending.slice(1)} loading={loading} viewAllHref="/manga/discover?sort=trending" />
        <Section title="Popular" icon={TrendingUp} items={popular} loading={loading} viewAllHref="/manga/discover?sort=popular" />
        <Section title="Top Rated" icon={Star} items={topRated} loading={loading} viewAllHref="/manga/discover?sort=score" />
        <Section title="New Releases" icon={Clock} items={newReleases} loading={loading} viewAllHref="/manga/discover?sort=new" />

        {/* Genres Grid */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-red-500" />
            <h2 className="font-black text-base text-white uppercase tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
              Browse Genres
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Action', 'Romance', 'Fantasy', 'Horror', 'Sci-Fi', 'Comedy', 'Drama', 'Mystery', 'Psychological', 'Slice of Life', 'Adventure', 'Supernatural'].map(g => (
              <Link key={g} href={`/manga/discover?genre=${encodeURIComponent(g)}`}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/30 border border-red-900/30 text-red-300/80 hover:bg-red-900/40 hover:text-red-200 hover:border-red-700/50 transition-all">
                {g}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
