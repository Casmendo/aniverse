'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Star, BookOpen } from 'lucide-react';
import { unifiedMangaService, type MangaCard } from '@/lib/manga/unifiedService';
import { STATUS_LABELS } from '@/lib/manga/unifiedTypes';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function MangaCardComp({ manga, index = 0 }: { manga: MangaCard; index?: number }) {
  const statusLabel = (STATUS_LABELS as any)[manga.status] || manga.status;
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
      <Link href={`/manga/${manga.anilistId}`} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all group">
        <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-blue-50">
          {manga.coverImage
            ? <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-blue-800" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors line-clamp-1">{manga.title}</h3>
          <p className="text-[11px] text-blue-500/60 font-bold uppercase tracking-wide mt-0.5">{manga.genres[0] || manga.format}</p>
          <div className="flex items-center gap-3 mt-1">
            {manga.rating > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                <Star size={9} fill="currentColor" /> {(manga.rating / 10).toFixed(1)}
              </span>
            )}
            <span className="text-[10px] text-slate-600">{statusLabel}</span>
            {manga.totalChapters && <span className="text-[10px] font-mono text-slate-600">{manga.totalChapters} ch</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'Any Status' },
  { value: 'RELEASING', label: 'Ongoing' },
  { value: 'FINISHED', label: 'Completed' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
];

const SORT_OPTIONS = [
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'POPULARITY_DESC', label: 'Most Popular' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'START_DATE_DESC', label: 'Newest' },
];

export default function MangaSearchPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('TRENDING_DESC');
  const [results, setResults] = useState<MangaCard[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await unifiedMangaService.search(debouncedQuery, {
        status: status || undefined,
        sort: sortBy,
        perPage: 30,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, status, sortBy]);

  useEffect(() => { doSearch(); }, [doSearch]);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #f8fafc 0%, #ffffff 40%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 pt-4 pb-3 bg-white/95 backdrop-blur-xl border-b border-blue-200">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search manga titles..."
            autoFocus
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-slate-800 placeholder-slate-600 outline-none focus:border-blue-600/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-slate-600 outline-none">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-slate-600 outline-none">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="px-4 pt-5 flex flex-col gap-2">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-red-950/10">
                <div className="skeleton w-12 h-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="skeleton h-3.5 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-1/3 rounded" />
                  <div className="skeleton h-2.5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No results found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        )}

        <AnimatePresence>
          {!loading && results.map((m, i) => <MangaCardComp key={m.anilistId} manga={m} index={i} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}
