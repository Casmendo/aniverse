'use client';
import { useDownloadQueueStore } from '@/store/downloadQueueStore';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalDownloadProgress() {
  const items = useDownloadQueueStore(s => s.items);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            className="w-72 backdrop-blur-xl border border-s5/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden pointer-events-auto"
            style={{ background: 'var(--s1-95)' }}
          >
            {item.progress < 100 && (
              <div className="absolute inset-0 bg-s5/5 animate-pulse" />
            )}
            <div className="relative flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {item.progress < 100 ? (
                  <Loader2 size={16} className="text-s5 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-s5 shrink-0" />
                )}
                <span className="text-xs text-white font-bold truncate">{item.title}</span>
              </div>
              <span className="text-[10px] font-mono text-s4 font-bold shrink-0">{item.progress}%</span>
            </div>
            <div className="relative w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out ${item.progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-s5 to-s4'}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
