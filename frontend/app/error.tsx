'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error('[AniVerse]', error), [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-6">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-bold text-xl text-s5 mb-2">Something went wrong</h2>
        <p className="text-sm text-s3 max-w-xs mb-6">{error.message||'An unexpected error occurred.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-6 py-3 rounded-full bg-s5 text-s0 font-bold text-sm hover:bg-s4 transition-all">
            Try Again
          </button>
          <a href="/"
            className="px-6 py-3 rounded-full bg-s1 border border-[var(--border)] text-s4 text-sm hover:bg-s2 transition-all">
            Go Home
          </a>
        </div>
      </motion.div>
    </div>
  );
}
