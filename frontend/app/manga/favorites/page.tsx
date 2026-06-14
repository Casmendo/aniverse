'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, BookOpen, Clock, Star } from 'lucide-react';
import { useMangaStore } from '@/store/mangaStore';

export default function FavoritesPage() {
  const bookmarks = useMangaStore(s => s.getAllBookmarks());
  const progress = useMangaStore(s => s.getAllProgress());
  const toggleBookmark = useMangaStore(s => s.toggleBookmark);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #0f0204 0%, #06141B 40%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 h-14 flex items-center bg-black/80 backdrop-blur-xl border-b border-red-950/20">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-red-500" />
          <span className="font-black text-white text-sm tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
            SAVED MANGA
          </span>
        </div>
      </div>

      <div className="px-4 pt-6">
        {bookmarks.length === 0 ? (
          <div className="text-center py-24 text-slate-600">
            <Heart size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-slate-500">No saved manga yet</p>
            <p className="text-sm mt-1">Tap the bookmark icon on any manga to save it here</p>
            <Link href="/manga/discover" className="inline-block mt-6 px-6 py-2.5 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-colors">
              Discover Manga
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {bookmarks.map((bm, i) => (
              <motion.div
                key={bm.mangaId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="relative group">
                  <Link href={`/manga/${bm.mangaId}`} className="block">
                    <div className="relative overflow-hidden rounded-xl border border-red-950/20 bg-[#0d0505] group-hover:border-red-800/30 transition-all group-hover:-translate-y-1">
                      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                        {bm.coverArt ? (
                          <img src={bm.coverArt} alt={bm.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-red-950/20 flex items-center justify-center">
                            <BookOpen size={28} className="text-red-800" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-xs font-bold text-slate-300 line-clamp-2 leading-snug">{bm.title}</h3>
                        <p className="text-[9px] text-slate-600 mt-1">{new Date(bm.addedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleBookmark({ id: bm.mangaId, title: bm.title, coverArt: bm.coverArt, status: bm.status })}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Heart size={12} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Continue Reading Section */}
        {progress.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-red-500" />
              <h2 className="font-black text-sm text-white uppercase tracking-wider" style={{ fontFamily: "'Orbitron', monospace" }}>
                Continue Reading
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {progress.slice(0, 10).map(p => (
                <Link key={p.mangaId} href={`/manga/read/${p.mangaId}/${p.chapterId}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-red-950/10 border border-red-900/10 hover:border-red-800/30 transition-all group">
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-red-950/20">
                    {p.coverArt
                      ? <img src={p.coverArt} alt={p.mangaTitle} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-red-800" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white line-clamp-1">{p.mangaTitle}</h3>
                    <p className="text-xs text-red-500/60 font-bold mt-0.5">Chapter {p.chapterNum}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 rounded-full bg-red-950/50">
                        <div className="h-full rounded-full bg-red-600" style={{ width: `${(p.page / p.totalPages) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 shrink-0">{p.page}/{p.totalPages}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
