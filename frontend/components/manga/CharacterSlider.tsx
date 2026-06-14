'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MangaCharacter } from '@/lib/manga/unifiedTypes';

interface CharacterSliderProps {
  characters: MangaCharacter[];
}

function CharacterCard({ char, index }: { char: MangaCharacter; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.6) }}
      className="shrink-0 w-36 group"
    >
      <div className="relative overflow-hidden rounded-xl bg-[#0d0204] border border-red-950/25 hover:border-red-700/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(225,29,72,0.2)]">
        {/* Character image */}
        <div className="relative overflow-hidden h-48">
          {char.image ? (
            <img
              src={char.image}
              alt={char.name}
              loading="lazy"
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-red-950/20 flex items-center justify-center text-3xl font-black text-red-900">
              {char.name[0]}
            </div>
          )}
          {/* Role badge */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-sm text-red-400 border border-red-900/30">
            {char.role === 'MAIN' ? 'Main' : char.role === 'SUPPORTING' ? 'Support' : 'BG'}
          </div>
          {/* Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d0204] to-transparent" />
        </div>

        {/* Info */}
        <div className="px-2.5 pb-2.5 pt-1">
          <p className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
            {char.name}
          </p>

          {/* Voice Actor */}
          {char.voiceActor && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-red-950/30">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-red-950/30 shrink-0 border border-red-900/20">
                {char.voiceActor.image ? (
                  <img src={char.voiceActor.image} alt={char.voiceActor.name} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 line-clamp-1">{char.voiceActor.name}</p>
                <p className="text-[9px] text-red-600/60 font-bold uppercase tracking-wider">VA</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CharacterSlider({ characters }: CharacterSliderProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  if (!characters.length) return null;

  return (
    <div className="relative group/slider">
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-black/80 border border-red-900/30 flex items-center justify-center text-red-400 opacity-0 group-hover/slider:opacity-100 hover:bg-red-950/60 transition-all shadow-lg"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Scrollable Row */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {characters.map((char, i) => (
          <div key={char.id} style={{ scrollSnapAlign: 'start' }}>
            <CharacterCard char={char} index={i} />
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-black/80 border border-red-900/30 flex items-center justify-center text-red-400 opacity-0 group-hover/slider:opacity-100 hover:bg-red-950/60 transition-all shadow-lg"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
