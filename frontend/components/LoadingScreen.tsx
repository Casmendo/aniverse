'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase]     = useState<'logo'|'bar'|'out'>('logo');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Phase 1: logo fades in
    const t1 = setTimeout(() => setPhase('bar'), 600);

    // Phase 2: progress bar fills
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 5 + 2; // Slower fill
      if (p >= 100) { p = 100; clearInterval(iv); }
      setProgress(Math.min(100, p));
    }, 200);

    // Phase 3: exit
    const t3 = setTimeout(() => {
      setPhase('out');
      setTimeout(onDone, 600);
    }, 5000); // Extended to ~5 seconds

    return () => { clearTimeout(t1); clearTimeout(t3); clearInterval(iv); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[999] flex flex-col items-center justify-center
      bg-s0 transition-opacity duration-600 ${phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

      {/* Film grain */}
      <div className="absolute inset-0 film-grain pointer-events-none" />

      {/* Horizontal scan lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'repeating-linear-gradient(0deg,rgba(6,20,27,0.5) 0px,rgba(6,20,27,0.5) 1px,transparent 1px,transparent 3px)', backgroundSize:'100% 3px' }} />

      {/* Logo */}
      <div className={`flex flex-col items-center transition-all duration-700 ${phase === 'logo' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {/* A glyph */}
        <div className="relative mb-6">
          <svg viewBox="0 0 80 90" fill="none" className="w-20 h-20">
            <defs>
              <linearGradient id="lsGrad" x1="0" y1="0" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--s4)"/>
                <stop offset="60%" stopColor="var(--s3)"/>
                <stop offset="100%" stopColor="var(--s1)"/>
              </linearGradient>
            </defs>
            {/* Bold futuristic A */}
            <path d="M40 4L76 86H60L53 68H27L20 86H4Z" fill="url(#lsGrad)"/>
            <path d="M40 24L52 60H28Z" fill="var(--s0)"/>
            {/* Corner accents */}
            <line x1="0" y1="86" x2="14" y2="86" stroke="var(--s4)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="66" y1="86" x2="80" y2="86" stroke="var(--s4)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="40" cy="4" r="3.5" fill="var(--s4)"/>
          </svg>
          {/* Animated underline */}
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-s2">
            <div className="h-full bg-s4 transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="font-display font-black tracking-widest text-2xl text-s5 mb-1">
          ANIVERSE
        </div>
        <div className="font-mono text-s3 text-[10px] tracking-[.3em] uppercase mb-10">
          Enter the Multiverse
        </div>

        {/* Progress */}
        <div className="w-48 h-[2px] bg-s2 rounded-full overflow-hidden">
          <div className="h-full bg-s5 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="font-mono text-s3 text-[10px] mt-2">
          {Math.round(progress)}%
        </div>

          <div className="absolute bottom-12 flex flex-col items-center gap-2 transition-all duration-700" style={{ opacity: phase === 'bar' ? 1 : 0 }}>
          <div className="flex items-center gap-2 text-sm text-s3">
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>♥</span>
            <span className="font-mono tracking-wider text-[10px] uppercase">
              Built with love by <span className="text-s5 font-bold">Leo</span>
            </span>
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>♥</span>
          </div>
        </div>
      </div>
    </div>
  );
}
