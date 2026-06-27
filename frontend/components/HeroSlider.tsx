'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractAnimeData } from '@/lib/utils';

export default function HeroSlider({ items }: { items: Record<string,unknown>[] }) {
  const [idx,       setIdx]       = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused,    setPaused]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const slides   = items.slice(0, 6).map(extractAnimeData);

  const go = useCallback((next: number) => {
    const n = ((next % slides.length) + slides.length) % slides.length;
    setDirection(next > idx ? 1 : -1);
    setIdx(n);
  }, [idx, slides.length]);

  useEffect(() => {
    if (paused || !slides.length) return;
    timerRef.current = setInterval(() => go(idx + 1), 5500);
    return () => clearInterval(timerRef.current);
  }, [idx, paused, slides.length, go]);

  if (!slides.length) return <HeroSkeleton />;
  const s = slides[idx];

  const slideVariants = {
    enter: (d: number) => ({ opacity:0, x: d > 0 ? 60 : -60, scale: 1.02 }),
    center:{ opacity:1, x:0, scale:1, transition:{ duration:0.7, ease:[0.16,1,0.3,1] } },
    exit:  (d: number) => ({ opacity:0, x: d > 0 ? -40 : 40, scale:0.99, transition:{ duration:0.4, ease:'easeIn' } }),
  };

  return (
    <section
      className="relative w-full overflow-hidden film-grain"
      style={{ height:'min(90vh,700px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Background layers */}
      <AnimatePresence custom={direction} initial={false}>
        <motion.div key={idx} className="absolute inset-0"
          custom={direction} variants={{
            enter:(d)=>({ opacity:0 }),
            center:{ opacity:1, transition:{ duration:0.9 } },
            exit:{ opacity:0, transition:{ duration:0.5 } },
          }}
          initial="enter" animate="center" exit="exit">
          {/* BG image */}
          <div className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:`url('${s.banner || s.cover }')`,
              filter:'brightness(0.28) saturate(0.7)',
              transform:'scale(1.05)',
            }} />
          {/* Colour grade overlay */}
          <div className="absolute inset-0" style={{
            background:'linear-gradient(135deg,rgba(6,20,27,0.9) 0%,rgba(17,33,45,0.4) 60%,transparent 100%)'
          }} />
          <div className="absolute inset-0" style={{
            background:'linear-gradient(0deg,rgba(6,20,27,1) 0%,rgba(6,20,27,0.5) 35%,transparent 65%)'
          }} />
          {/* Right vignette */}
          <div className="absolute inset-0" style={{
            background:'linear-gradient(270deg,rgba(6,20,27,0.8) 0%,transparent 50%)'
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Horizontal scan lines texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.4) 0px,rgba(0,0,0,0.4) 1px,transparent 1px,transparent 4px)', backgroundSize:'100% 4px' }} />

      {/* Content */}
      <AnimatePresence custom={direction} initial={false} mode="wait">
        <motion.div
          key={`content-${idx}`}
          custom={direction}
          variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          className="absolute bottom-[80px] left-[clamp(20px,6vw,80px)] max-w-[560px] z-10">

          {/* Status chip */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-s1/80 border border-[var(--border)] text-[10px] font-mono font-bold text-s4 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-s5 animate-pulse-soft" />
            {s.status || 'Now Streaming'}
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-s5 leading-[1.08] mb-3"
            style={{ fontSize:'clamp(1.8rem,4.5vw,3.4rem)', textShadow:'0 4px 32px rgba(0,0,0,0.8)' }}>
            {s.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-3 mb-3 text-sm">
            {s.score > 0 && <span className="font-mono font-bold text-s5">★ {s.score.toFixed(1)}</span>}
            {s.type && <span className="px-2 py-0.5 rounded bg-s2/80 text-s4 text-xs border border-[var(--border)]">{s.type}</span>}
            {s.year && <span className="text-s4 text-xs">{s.year}</span>}
            {s.episodes > 0 && <span className="text-s4 text-xs">{s.episodes} eps</span>}
          </div>

          {/* Genres */}
          {s.genres.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {s.genres.slice(0,4).map(g => (
                <span key={g} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-s4 bg-s1/60 border border-[var(--border)]">{g}</span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-s4 text-sm leading-relaxed mb-7 line-clamp-2 max-w-[460px]">{s.description}</p>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap">
            <Link href={`/anime/${s.slug}?title=${encodeURIComponent(s.title)}`}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm bg-s5 text-s0 hover:bg-s4 hover:-translate-y-0.5 transition-all duration-250"
              style={{ boxShadow:'var(--shadow)' }}>
              <Play size={17} fill="currentColor" /> Watch Now
            </Link>
            <Link href={`/anime/${s.slug}?title=${encodeURIComponent(s.title)}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm text-s5 bg-s1/70 border border-[var(--border-hi)] hover:bg-s2 hover:-translate-y-0.5 transition-all duration-250">
              <Info size={15} /> More Info
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      {[{dir:-1,Icon:ChevronLeft,pos:'left-3'},{dir:1,Icon:ChevronRight,pos:'right-3'}].map(({dir,Icon,pos}) => (
        <button key={dir} onClick={() => go(idx + dir)}
          className={`absolute top-1/2 -translate-y-1/2 ${pos} z-20 w-10 h-10 rounded-full bg-s1/60 border border-[var(--border)] flex items-center justify-center text-s4 hover:text-s5 hover:bg-s2 transition-all opacity-60 hover:opacity-100`}>
          <Icon size={20} />
        </button>
      ))}

      {/* Dots */}
      <div className="absolute bottom-7 left-[clamp(20px,6vw,80px)] flex gap-2 z-10">
        {slides.map((_,i) => (
          <button key={i} onClick={() => go(i)}
            className={`rounded-full transition-all duration-400 ${i===idx ? 'w-7 h-1.5 bg-s5' : 'w-1.5 h-1.5 bg-s3 hover:bg-s4'}`} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-s2 z-10">
        <div key={`${idx}-progress`} className="h-full bg-s4 origin-left"
          style={{ animation: paused ? 'none' : 'heroBar 5.5s linear forwards' }} />
      </div>

      <style>{`
        @keyframes heroBar { from{width:0%} to{width:100%} }
      `}</style>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className="w-full skeleton" style={{height:'min(90vh,700px)'}}>
      <div className="absolute bottom-[80px] left-[clamp(20px,6vw,80px)] space-y-4 w-[460px] max-w-[90vw]">
        {[24,40,40,16,16,'',32,32].map((h,i) => h ?
          <div key={i} className="skeleton rounded-xl" style={{height:`${h}px`,width:i>4?'240px':'100%'}} /> : null
        )}
      </div>
    </div>
  );
}
