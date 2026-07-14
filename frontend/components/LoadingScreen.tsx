'use client';
import { useEffect, useState } from 'react';
import { Code } from 'lucide-react';

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
    <div className={`fixed inset-0 z-[999] flex flex-col bg-s0 transition-opacity duration-600 ${phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

      {/* Film grain */}
      <div className="absolute inset-0 film-grain pointer-events-none" />

      {/* Horizontal scan lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'repeating-linear-gradient(0deg,rgba(6,20,27,0.5) 0px,rgba(6,20,27,0.5) 1px,transparent 1px,transparent 3px)', backgroundSize:'100% 3px' }} />

      {/* Top spacer to push content to middle */}
      <div className="flex-1" />

      {/* Main Content (Centered) */}
      <div className={`flex flex-col items-center relative z-10 transition-all duration-700 ${phase === 'logo' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        
        {/* Text Logo */}
        <div className="relative mb-4 flex items-center select-none group">
          <span className="font-display font-black text-6xl tracking-tight text-accent drop-shadow-sm mr-2">
            Ani
          </span>
          <span className="font-display font-black text-6xl tracking-tight text-white drop-shadow-sm">
            Verse
          </span>
          
          {/* Animated underline */}
          <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-s2 rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="font-mono text-s4 text-[11px] tracking-[.4em] uppercase mb-12 mt-6 text-center">
          Enter the Multiverse
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center">
          <div className="w-64 h-[3px] bg-s2 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-s5 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }} />
          </div>
          <div className="font-mono text-s3 text-[11px] mt-3 font-semibold">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Bottom spacer and Footer */}
      <div className="flex-1 flex flex-col justify-end items-center pb-10 relative z-10">
        <div className={`flex flex-col items-center gap-3 transition-all duration-700 delay-300 ${phase === 'bar' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 text-sm text-s3 flex-wrap justify-center">
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>♥</span>
            <span className="font-mono tracking-wider text-[10px] uppercase">
              Built with love by <span className="text-s5 font-bold">Leo</span>
            </span>
            <span style={{ color: 'var(--s4)', fontSize: 14 }}>✦</span>
          </div>
          <div className="flex gap-5 mt-1 opacity-80 hover:opacity-100 transition-opacity">
            <a href="https://wa.me/23409039951951" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-s2/80 flex items-center justify-center hover:bg-s4 hover:text-white transition-colors shadow-lg backdrop-blur-sm" title="Contact Developer">
              <Code size={18} />
            </a>
            <a href="https://t.me/Aniverseup" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] flex items-center justify-center hover:bg-[#2AABEE] hover:text-white transition-colors shadow-lg backdrop-blur-sm" title="Telegram Channel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.309-.346-.111l-6.4 4.024-2.76-.86c-.6-.188-.61-.6.126-.89l10.814-4.17c.505-.19.95.128.846.942z"/></svg>
            </a>
            <a href="https://whatsapp.com/channel/0029Vb80hNm29758RPvXFc2K" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors shadow-lg backdrop-blur-sm" title="WhatsApp Channel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
