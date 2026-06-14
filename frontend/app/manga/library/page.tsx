'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Trash2, ChevronRight } from 'lucide-react';
import { useMangaStore } from '@/store/mangaStore';

export default function MangaLibraryPage() {
  const progress = useMangaStore(s => s.getAllProgress());
  const removeProgress = useMangaStore(s => s.removeProgress);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #0f0204 0%, #06141B 40%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 h-14 flex items-center justify-between bg-black/80 backdrop-blur-xl border-b border-red-950/20">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-red-500" />
          <span className="font-black text-white text-sm tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
            MY LIBRARY
          </span>
        </div>
        {progress.length > 0 && (
          <span className="text-xs font-bold text-slate-500">{progress.length} reading</span>
        )}
      </div>

      <div className="px-4 pt-6">
        {progress.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-700 opacity-40" />
            <p className="font-bold text-slate-500">Your reading history is empty</p>
            <p className="text-sm text-slate-600 mt-1">Start reading manga and your progress will appear here</p>
            <Link href="/manga/discover" className="inline-block mt-6 px-6 py-2.5 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-colors">
              Explore Manga
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {progress.map((p, i) => (
              <motion.div
                key={p.mangaId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-red-950/10 border border-red-900/15 hover:border-red-800/30 transition-all group"
              >
                <Link href={`/manga/${p.mangaId}`} className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-red-950/20">
                  {p.coverArt
                    ? <img src={p.coverArt} alt={p.mangaTitle} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-red-800" /></div>
                  }
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/manga/${p.mangaId}`}>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white line-clamp-1 transition-colors">{p.mangaTitle}</h3>
                  </Link>
                  <p className="text-xs text-red-500/60 font-bold mt-0.5">Ch {p.chapterNum} · Page {p.page}/{p.totalPages}</p>
                  
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 rounded-full bg-red-950/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500"
                        style={{ width: `${Math.max(2, (p.page / p.totalPages) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">{Math.round((p.page / p.totalPages) * 100)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-slate-600" />
                    <span className="text-[10px] text-slate-600">{new Date(p.lastRead).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Link href={`/manga/read/${p.mangaId}/${p.chapterId}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-500 transition-colors">
                    Resume <ChevronRight size={12} />
                  </Link>
                  <button onClick={() => removeProgress(p.mangaId)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition-all flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
