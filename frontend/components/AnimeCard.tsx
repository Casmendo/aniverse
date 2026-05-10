'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Play, Download, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  slug:        string;
  title:       string;
  cover:       string;
  score?:      number;
  episodes?:   number;
  type?:       string;
  delay?:      number;
  inWatchlist?:boolean;
  onDownload?: () => void;
  onWatchlist?:() => void;
}

export default function AnimeCard({ slug,title,cover,score,episodes,type,delay=0,inWatchlist,onDownload,onWatchlist }: Props) {
  const [src, setSrc] = useState(cover || `https://picsum.photos/seed/${slug}/300/450`);

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: delay/1000, duration:0.5, ease:[0.16,1,0.3,1] }}
      className="card-wrap flex-shrink-0 bg-s1 group"
      style={{ width:'clamp(128px,15vw,176px)' }}>

      <Link href={`/anime/${slug}?title=${encodeURIComponent(title)}`} className="block">
        {/* Poster */}
        <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
          <img src={src} alt={title} loading="lazy"
            onError={() => setSrc(`https://picsum.photos/seed/${slug}/300/450`)}
            className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-108" />

          {/* Score */}
          {score && score > 0 && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-s5 bg-s0/80">
              ★ {score.toFixed(1)}
            </div>
          )}

          {/* Type badge */}
          {type && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-s4 bg-s1/80 uppercase tracking-wide">
              {type}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-s0/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-3">
            <div className="w-12 h-12 rounded-full bg-s5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ boxShadow:'var(--shadow)' }}>
              <Play size={20} fill="#06141B" className="text-s0 ml-0.5" />
            </div>
            <p className="text-s5 text-xs font-semibold text-center leading-tight line-clamp-3">{title}</p>
          </div>
        </div>
      </Link>

      {/* Info bar */}
      <div className="px-2.5 py-2 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-s4 leading-tight line-clamp-2">{title}</p>
          {episodes && episodes > 0 && (
            <p className="text-[10px] text-s3 mt-0.5">{episodes} eps</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onWatchlist && (
            <button onClick={e => { e.preventDefault(); onWatchlist(); }}
              className={`w-6 h-6 rounded flex items-center justify-center transition-all ${inWatchlist ? 'text-s5 bg-s2' : 'text-s3 hover:text-s5 hover:bg-s2'}`}>
              <Bookmark size={11} fill={inWatchlist ? 'currentColor' : 'none'} />
            </button>
          )}
          {onDownload && (
            <button onClick={e => { e.preventDefault(); onDownload(); }}
              className="w-6 h-6 rounded flex items-center justify-center text-s3 hover:text-s5 hover:bg-s2 transition-all">
              <Download size={11} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{width:'clamp(128px,15vw,176px)'}}>
      <div className="skeleton w-full" style={{aspectRatio:'2/3'}} />
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/5 rounded" />
      </div>
    </div>
  );
}
