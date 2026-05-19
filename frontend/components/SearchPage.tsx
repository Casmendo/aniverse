'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { animeAPI } from '@/lib/api';
import { extractAnimeData } from '@/lib/utils';
import Image from 'next/image';

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  initialRecs: Record<string,unknown>[];
}

export default function SearchPage({ isOpen, onClose, initialRecs }: Props) {
  const router  = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<ReturnType<typeof extractAnimeData>[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
      // Load search history from localStorage
      try {
        const h = JSON.parse(localStorage.getItem('aniverse-search-history') || '[]');
        setHistory(h);
      } catch {}
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const saveHistory = (q: string) => {
    const h = [q, ...history.filter(x => x !== q)].slice(0, 8);
    setHistory(h);
    localStorage.setItem('aniverse-search-history', JSON.stringify(h));
  };

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const runSearch = useCallback((q: string) => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      if (!q.trim()) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const { data } = await animeAPI.search(q);
        const items = (data.results || data.data || data.anime || []).slice(0, 20);
        setResults(items.map((r: Record<string,unknown>) => extractAnimeData(r)));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 320);
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    if (v.trim()) runSearch(v);
    else setResults([]);
  };

  const go = (slug: string, title: string) => {
    if (query.trim()) saveHistory(query.trim());
    onClose();
    router.push(`/anime/${slug}?title=${encodeURIComponent(title)}`);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aniverse-search-history');
  };

  const displayItems = query.trim()
    ? results
    : initialRecs.map(r => extractAnimeData(r));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit:    { opacity: 0, transition: { duration: 0.2 } },
  };

  const panelVariants = {
    hidden:  { y: -20, opacity: 0, scale: 0.98 },
    visible: { y: 0,   opacity: 1, scale: 1,    transition: { duration: 0.4, ease: [0.16,1,0.3,1] } },
    exit:    { y: -10, opacity: 0, scale: 0.99,  transition: { duration: 0.25, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-overlay"
          variants={containerVariants}
          initial="hidden" animate="visible" exit="exit"
          className="fixed inset-0 z-[80] flex flex-col"
          style={{ background: 'rgba(6,20,27,0.97)', backdropFilter: 'blur(24px)' }}>

          {/* Close on bg click */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            variants={panelVariants}
            initial="hidden" animate="visible" exit="exit"
            className="relative z-10 w-full max-w-3xl mx-auto flex flex-col h-full px-4 pt-[72px]">

            {/* Search input */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl bg-s1 border border-[var(--border-hi)]"
                style={{ boxShadow: 'var(--shadow)' }}>
                <Search size={18} className="text-s3 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') onClose();
                    if (e.key === 'Enter' && results[0]) go(results[0].slug, results[0].title);
                  }}
                  placeholder="Search anime, genres, studios…"
                  className="flex-1 bg-transparent outline-none text-s5 text-base placeholder:text-s3 font-body"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                    className="text-s3 hover:text-s5 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button onClick={onClose}
                className="w-12 h-12 rounded-xl bg-s1 border border-[var(--border)] flex items-center justify-center text-s4 hover:text-s5 hover:bg-s2 transition-all shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Search history (only when no query) */}
            {!query && history.length > 0 && (
              <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
                className="flex items-center gap-2 flex-wrap mb-4">
                <Clock size={13} className="text-s3" />
                <span className="text-s3 text-xs font-mono uppercase tracking-wider">Recent</span>
                {history.map((h) => (
                  <button key={h} onClick={() => { setQuery(h); runSearch(h); }}
                    className="px-3 py-1 rounded-full bg-s1 border border-[var(--border)] text-s4 text-xs hover:bg-s2 hover:text-s5 transition-all">
                    {h}
                  </button>
                ))}
                <button onClick={clearHistory} className="text-s3 text-xs hover:text-s4 ml-auto">Clear</button>
              </motion.div>
            )}

            {/* Header label */}
            <div className="flex items-center gap-2 mb-4">
              {loading ? (
                <div className="w-3 h-3 rounded-full border-2 border-s3 border-t-s5 animate-spin" />
              ) : (
                <TrendingUp size={14} className="text-s3" />
              )}
              <span className="text-s3 text-xs font-mono uppercase tracking-widest">
                {query
                  ? loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                  : 'Recommended for you'}
              </span>
            </div>

            {/* Results grid — scrollable */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              {displayItems.length === 0 && !loading && query ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-s3">
                  <Search size={40} className="opacity-30" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {displayItems.map((a, i) => (
                    <motion.button
                      key={a.slug}
                      initial={{ opacity:0, y:16 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay: i * 0.03, ease:[0.16,1,0.3,1], duration:0.4 }}
                      onClick={() => go(a.slug, a.title)}
                      className="card-wrap text-left bg-s1 flex flex-col overflow-hidden group">
                      {/* Poster */}
                      <div className="relative w-full overflow-hidden" style={{aspectRatio:'2/3'}}>
                        <img src={a.cover || `https://picsum.photos/seed/${a.slug}/300/450`}
                          alt={a.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={e => { (e.target as HTMLImageElement).src=`https://picsum.photos/seed/${a.slug}/300/450`; }}
                        />
                        {/* Score */}
                        {a.score > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-s5 text-[10px] font-mono font-bold">
                            ★ {a.score.toFixed(1)}
                          </div>
                        )}
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-s0/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-xs font-semibold text-s5 leading-tight line-clamp-3">{a.title}</span>
                        </div>
                      </div>
                      {/* Title */}
                      <div className="p-2.5">
                        <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{a.title}</p>
                        {(a.year || a.type) && (
                          <p className="text-[10px] text-s3 mt-0.5">{[a.year,a.type].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
