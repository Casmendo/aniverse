import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bookmark, Star } from 'lucide-react';
import type { MangaResult } from '../../lib/manga/types';
import { useMangaStore } from '../../store/mangaStore';

interface MangaCardProps {
  manga: MangaResult;
  index?: number;
  priority?: boolean;
}

export default function MangaCard({ manga, index = 0, priority = false }: MangaCardProps) {
  const isBookmarked = useMangaStore(state => state.isBookmarked(manga.id));

  // Determine primary genre
  const primaryGenre = manga.tags.find(t => t.group === 'genre')?.name || 
                       manga.tags[0]?.name || 'Manga';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="card-wrap bg-s1 group relative h-full flex flex-col"
    >
      <Link href={`/manga/${manga.id}`} className="flex flex-col h-full">
        {/* Cover Art Container */}
        <div className="relative overflow-hidden bg-s2" style={{ aspectRatio: '2/3' }}>
          {manga.coverArt ? (
            <img 
              src={manga.coverArt} 
              alt={manga.title} 
              loading={priority ? 'eager' : 'lazy'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4 text-center">
              <span className="text-s4 text-xs font-bold font-mono uppercase">{primaryGenre}</span>
            </div>
          )}

          {/* Badges / Overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {manga.contentRating !== 'safe' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase shadow-sm">
                {manga.contentRating}
              </span>
            )}
            {manga.status === 'ongoing' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-s5/90 text-s0 uppercase shadow-sm">
                Up
              </span>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-s0/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Details */}
        <div className="p-2.5 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-[11px] text-accent font-bold mb-0.5 uppercase tracking-wider truncate">
              {primaryGenre}
            </p>
            <h3 className="text-xs font-bold text-s5 line-clamp-2 leading-snug group-hover:text-accent transition-colors">
              {manga.title}
            </h3>
          </div>
          
          {(manga.rating || manga.lastChapter) && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-hi)]">
              {manga.rating ? (
                <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                  <Star size={10} fill="currentColor" />
                  <span>{manga.rating.toFixed(1)}</span>
                </div>
              ) : <div />}
              
              {manga.lastChapter && (
                <span className="text-[10px] font-mono font-bold text-s4">
                  CH {manga.lastChapter}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Quick Bookmark Toggle (Desktop Hover / Mobile visible if bookmarked) */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          useMangaStore.getState().toggleBookmark(manga);
        }}
        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md z-10
          ${isBookmarked 
            ? 'bg-accent text-slate-900 opacity-100' 
            : 'bg-s0/80 text-s4 opacity-0 group-hover:opacity-100 hover:bg-s2 hover:text-s5'
          }
        `}
      >
        <Bookmark size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
      </button>
    </motion.div>
  );
}
