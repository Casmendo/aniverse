'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MangaExitSplash({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = Date.now();
    const duration = 2000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(onDone, 300);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between"
      style={{ background: '#13151a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm px-8 pt-10">
        
        {/* The 'A' Logo */}
        <motion.div 
          className="relative flex flex-col items-center justify-center mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Top dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 absolute -top-1 z-10" />
          
          {/* The A shape */}
          <svg viewBox="0 0 100 120" className="w-24 h-28 drop-shadow-lg">
            <path d="M50 10 L20 110" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M50 10 L80 110" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M35 75 L65 75" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" fill="none" />
          </svg>
          
          {/* Base line */}
          <div className="w-28 h-1 bg-slate-600 rounded-full mt-2 overflow-hidden relative">
            <motion.div 
              className="absolute left-0 top-0 bottom-0 bg-slate-400" 
              initial={{ width: 0 }}
              animate={{ width: '40%' }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.h1 
          className="font-black text-[28px] tracking-[0.2em] text-slate-100 mb-2"
          style={{ fontFamily: "'Orbitron', monospace" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          ANIVERSE
        </motion.h1>
        
        <motion.p 
          className="text-[10px] font-bold tracking-[0.3em] text-slate-500 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ENTER THE MULTIVERSE
        </motion.p>

        {/* Loading Bar */}
        <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
          <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-400 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-slate-600">
            {Math.floor(progress)}%
          </span>
        </div>
      </div>

      {/* Footer */}
      <motion.div 
        className="pb-10 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[10px] font-bold tracking-widest text-slate-600 flex items-center gap-1">
          <span className="text-red-500">♥</span> BUILT WITH LOVE BY LEO <span className="text-slate-700">✦</span>
        </p>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
            {/* Github icon mock */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
            {/* Telegram icon mock */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
            {/* WhatsApp icon mock */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
