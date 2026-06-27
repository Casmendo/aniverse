import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Bookmark, Star, ChevronRight } from 'lucide-react';
import type { MangaResult } from '../../lib/manga/types';
import { useMangaStore } from '../../store/mangaStore';

export default function MangaHero({ manga }: { manga: MangaResult }) {
  const isBookmarked = useMangaStore(state => state.isBookmarked(manga.id));
  const primaryGenre = manga.tags.find(t => t.group === 'genre')?.name || 'Manga';

  return (
    <div className="relative w-full h-[60vh] min-h-[450px] bg-s0 border-b border-[var(--border)] overflow-hidden group">
      {/* Background Image & Blur */}
      {manga.coverArt ? (
        <motion.div 
          initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 10, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img src={manga.coverArt} alt="" className="w-full h-full object-cover opacity-30 blur-2xl saturate-150 scale-110" />
          <img src={manga.coverArt} alt="" className="w-full h-full object-cover opacity-20 film-grain" />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-s1 to-s0" />
      )}

      {/* Masking Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-s0 via-s0/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-s0/90 via-s0/40 to-transparent" />

      <div className="absolute inset-0 px-[clamp(16px,5vw,56px)] pb-12 flex items-end">
        <div className="w-full max-w-7xl mx-auto flex items-end gap-8 z-10">
          
          {/* Main Cover (Desktop) */}
          <motion.div 
            initial={{ opacity: 0, y: 20, rotateY: 15 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: 0.6 }}
            className="hidden md:block w-56 xl:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/10"
            style={{ perspective: '1000px' }}
          >
            <img src={manga.coverArt} alt={manga.title} className="w-full h-full object-cover" />
          </motion.div>

          {/* Details */}
          <div className="flex-1 min-w-0 pb-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-3 text-[10px] font-bold font-mono tracking-widest uppercase">
                <span className="text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">TRENDING</span>
                <span className="text-s3">{primaryGenre}</span>
                {manga.rating && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star size={12} fill="currentColor" /> {manga.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-3xl md:text-5xl xl:text-6xl text-slate-900 mb-4 line-clamp-2 leading-tight drop-shadow-lg">
                {manga.title}
              </h1>

              <p className="text-s4 text-sm md:text-base max-w-2xl line-clamp-3 mb-8 leading-relaxed font-medium text-shadow-sm">
                {manga.description || 'No description available for this manga.'}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link href={`/manga/${manga.id}`}
                  className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-accent text-slate-900 font-bold hover:bg-white hover:text-accent transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                >
                  <Play size={18} className="fill-current" />
                  Read Now
                </Link>

                <button 
                  onClick={() => useMangaStore.getState().toggleBookmark(manga)}
                  className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all glass-hi
                    ${isBookmarked ? 'border-accent text-accent' : 'border-white/20 text-slate-900 hover:border-white'}
                  `}
                >
                  <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                
                <Link href={`/manga/${manga.id}`} className="hidden md:flex items-center gap-2 text-sm font-bold text-s4 hover:text-slate-900 transition-colors ml-4">
                  Details <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
