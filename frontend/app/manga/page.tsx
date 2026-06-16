'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Star, Clock, Sparkles, ChevronRight, BookOpen, BarChart2, X } from 'lucide-react';
import { unifiedMangaService, type MangaCard } from '@/lib/manga/unifiedService';
import { useMangaStore } from '@/store/mangaStore';
import { STATUS_LABELS } from '@/lib/manga/unifiedTypes';

// ── Manga Card ────────────────────────────────────────────────────────────────
function MCard({ manga, index = 0 }: { manga: MangaCard; index?: number }) {
  const [err, setErr] = useState(false);
  const status = (STATUS_LABELS as any)[manga.status] || manga.status;
  const statusColor: Record<string, string> = {
    RELEASING: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    FINISHED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    NOT_YET_RELEASED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/manga/${manga.anilistId}`} className="block group">
        <div className="relative overflow-hidden rounded-xl bg-white border border-blue-200 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_48px_rgba(37,99,235,0.25)] group-hover:border-blue-400">
          <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
            {!err && manga.coverImage ? (
              <img src={manga.coverImage} alt={manga.title} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                onError={() => setErr(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50">
                <BookOpen size={32} className="text-blue-800" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Score */}
            {manga.rating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/90 backdrop-blur-sm text-yellow-400 text-[10px] font-bold">
                ★ {(manga.rating / 10).toFixed(1)}
              </div>
            )}
            {/* Status */}
            <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold border backdrop-blur-sm ${statusColor[manga.status] || 'text-slate-600 bg-slate-500/10 border-slate-500/20'}`}>
              {status}
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-blue-500/70 uppercase tracking-wider mb-0.5 truncate">
              {manga.genres[0] || manga.format}
            </p>
            <h3 className="text-xs font-bold text-slate-700 line-clamp-2 leading-snug group-hover:text-slate-900 transition-colors">
              {manga.title}
            </h3>
            {manga.totalChapters && (
              <p className="text-[10px] font-mono text-slate-600 mt-1">{manga.totalChapters} ch</p>
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
        <div className="skeleton h-2.5 w-14 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

// ── Horizontal Scroll Section ─────────────────────────────────────────────────
function Section({ title, icon: Icon, items, loading, href }: {
  title: string; icon: any; items: MangaCard[]; loading: boolean; href?: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-blue-500" />
          <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
            {title}
          </h2>
        </div>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-bold text-blue-500/70 hover:text-blue-600 transition-colors">
            See All <ChevronRight size={13} />
          </Link>
        )}
      </div>
      {loading ? (
        <div className="snap-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[140px]"><CardSkeleton /></div>
          ))}
        </div>
      ) : (
        <div className="snap-row">
          {items.map((m, i) => (
            <div key={m.anilistId} className="shrink-0 w-[140px] sm:w-[155px]" style={{ scrollSnapAlign: 'start' }}>
              <MCard manga={m} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ manga }: { manga: MangaCard | null }) {
  if (!manga) return <div className="skeleton rounded-2xl h-[55vh] min-h-[350px] mb-8" />;
  return (
    <Link href={`/manga/${manga.anilistId}`} className="block relative w-full h-[55vh] min-h-[350px] mb-8 overflow-hidden rounded-2xl group cursor-pointer shadow-xl">
      <div className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700"
        style={{ backgroundImage: `url(${manga.coverImage})`, filter: 'blur(14px) brightness(0.2) saturate(1.6)' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-end p-4 md:p-8">
        <div className="flex items-end gap-3 md:gap-4 w-full">
          {/* Cover always visible */}
          <div className="w-24 sm:w-32 md:w-44 shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-2xl group-hover:shadow-[0_20px_60px_rgba(37,99,235,0.3)] transition-shadow"
            style={{ aspectRatio: '2/3' }}>
            <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {manga.genres.slice(0, 3).map(g => (
                <span key={g} className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/40 uppercase">
                  {g}
                </span>
              ))}
            </div>
            <h1 className="font-black text-white text-lg sm:text-2xl md:text-4xl leading-tight mb-1.5 drop-shadow-xl line-clamp-2"
              style={{ fontFamily: "'Orbitron', monospace" }}>
              {manga.title}
            </h1>
            {manga.rating > 0 && (
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-yellow-400">
                ★ {(manga.rating / 10).toFixed(1)} / 10
                <span className="text-white/50 font-normal text-xs hidden sm:inline">{manga.popularity.toLocaleString()} followers</span>
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs sm:text-sm bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.5)] group-hover:bg-blue-500 transition-colors">
              <BookOpen size={13} /> Read Now
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Continue Reading Strip ────────────────────────────────────────────────────
function ContinueReading() {
  const allProgress = useMangaStore(s => s.getAllProgress());
  const removeProgress = useMangaStore(s => s.removeProgress);
  if (!allProgress.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-blue-500" />
        <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
          Continue Reading
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {allProgress.slice(0, 5).map(p => (
          <div key={p.mangaId} className="relative flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-400 transition-all group">
            <Link href={`/manga/${p.mangaId}/reader/${p.chapterId}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-blue-50 border border-blue-200">
                {p.coverArt && <img src={p.coverArt} alt={p.mangaTitle} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 line-clamp-1 transition-colors pr-8">{p.mangaTitle}</p>
                <p className="text-xs text-blue-500/60 font-bold">Ch {p.chapterNum}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-0.5 rounded-full bg-blue-200">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${(p.page / p.totalPages) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 shrink-0">{p.page}/{p.totalPages}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </Link>
            {/* Delete button */}
            <button
              onClick={e => { e.preventDefault(); removeProgress(p.mangaId); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-all"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const GENRES = ['Action', 'Romance', 'Fantasy', 'Horror', 'Sci-Fi', 'Comedy', 'Drama', 'Mystery', 'Psychological', 'Slice of Life', 'Adventure', 'Supernatural', 'Thriller', 'Sports'];

export default function MangaHome() {
  const [trending,    setTrending]    = useState<MangaCard[]>([]);
  const [popular,     setPopular]     = useState<MangaCard[]>([]);
  const [topRated,    setTopRated]    = useState<MangaCard[]>([]);
  const [newRelease,  setNewRelease]  = useState<MangaCard[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.allSettled([
      unifiedMangaService.getTrending(1, 20),
      unifiedMangaService.getPopular(1, 20),
      unifiedMangaService.getTopRated(1, 20),
      unifiedMangaService.getNewReleases(1, 16),
    ]).then(([t, p, tr, nr]) => {
      if (t.status  === 'fulfilled') setTrending(t.value);
      if (p.status  === 'fulfilled') setPopular(p.value);
      if (tr.status === 'fulfilled') setTopRated(tr.value);
      if (nr.status === 'fulfilled') setNewRelease(nr.value);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #f8fafc 0%, #ffffff 40%, #ffffff 100%)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 px-5 h-14 flex items-center justify-between bg-black/85 backdrop-blur-xl border-b border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.5)]">
            <BookOpen size={14} className="text-slate-900" />
          </div>
          <span className="font-black text-lg tracking-wider text-slate-900" style={{ fontFamily: "'Orbitron', monospace" }}>
            MANGA<span className="text-blue-500">VERSE</span>
          </span>
        </div>
        <Link href="/manga/search" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors">
          <Sparkles size={18} />
        </Link>
      </div>

      <div className="px-4 md:px-6 pt-5">
        {/* Hero */}
        {loading ? (
          <div className="skeleton rounded-2xl h-[42vh] min-h-[260px] mb-8" />
        ) : (
          <HeroBanner manga={trending[0] || null} />
        )}

        {/* Continue Reading (from store) */}
        <ContinueReading />

        {/* Sections */}
        <Section title="Trending Now"  icon={Flame}      items={trending.slice(1)} loading={loading} href="/manga/discover?sort=trending" />
        <Section title="Popular"       icon={TrendingUp}  items={popular}           loading={loading} href="/manga/discover?sort=popular" />
        <Section title="Top Rated"     icon={Star}        items={topRated}          loading={loading} href="/manga/discover?sort=score" />
        <Section title="New Releases"  icon={Clock}       items={newRelease}        loading={loading} href="/manga/discover?sort=new" />

        {/* Genres */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-blue-500" />
            <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
              Browse by Genre
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <Link key={g} href={`/manga/discover?genre=${encodeURIComponent(g)}`}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700/70 hover:bg-blue-100 hover:text-red-200 hover:border-blue-400 transition-all">
                {g}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
