'use client';
import { useState, useEffect } from 'react';
import { useDownloadQueueStore } from '@/store/downloadQueueStore';
import { useDownloadStore } from '@/store/downloadStore';
import { Loader2, Download, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalDownloadProgress() {
  const items = useDownloadQueueStore(s => s.items);
  const [collapsed, setCollapsed] = useState(false);
  const { fetch } = useDownloadStore();

  useEffect(() => {
    // Add global callbacks for Android to interact with
    if (typeof window !== 'undefined') {
      (window as any).updateDownloadProgress = (id: string, title: string, progress: number) => {
        useDownloadQueueStore.getState().addOrUpdateItem(id, title, progress);
      };
      (window as any).finishDownload = async (id: string, animeSlug: string, animeTitle: string, cover: string, epNum: number, epTitle: string, localPath: string) => {
        useDownloadQueueStore.getState().removeItem(id);
        await useDownloadStore.getState().add({
          anime_slug: animeSlug,
          anime_title: animeTitle,
          anime_cover: cover,
          episode_num: epNum,
          episode_id: id,
          episode_title: epTitle,
          localPath
        }, false);
        // Trigger refetch if needed
      };
    }
  }, []);

  if (items.length === 0) return null;

  // Assuming single item download for now, or just showing the first item's progress
  const item = items[0];
  const totalItems = items.length;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] pointer-events-none flex justify-center">
      <AnimatePresence mode="wait">
        {!collapsed ? (
          <motion.div key="expanded" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Download size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-bold mb-0.5">Download ({totalItems})</p>
                  <p className="text-sm text-white font-bold line-clamp-1">{item.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-accent font-bold text-sm">{Math.round(item.progress)}%</span>
                <button onClick={() => setCollapsed(true)} className="p-1 hover:bg-white/10 rounded-lg text-white/50 transition-colors">
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${item.progress}%` }} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="collapsed" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-0 right-0 pointer-events-auto cursor-pointer"
            onClick={() => setCollapsed(false)}>
            <div className="relative w-14 h-14 bg-[#1A1A1A] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.8)] border border-white/10 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 absolute inset-0">
                <circle cx="28" cy="28" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                <circle cx="28" cy="28" r="26" stroke="#e11d48" strokeWidth="3" fill="none" strokeDasharray="163.36" strokeDashoffset={163.36 - (163.36 * item.progress) / 100} className="transition-all duration-300" />
              </svg>
              {item.progress < 100 ? (
                <Download size={20} className="text-accent animate-pulse" />
              ) : (
                <Check size={20} className="text-green-400" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
