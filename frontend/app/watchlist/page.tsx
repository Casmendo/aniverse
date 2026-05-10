'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bookmark, BookmarkX, Play, X, Clock } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useToast } from '@/components/Toast';

export default function WatchlistPage() {
  const toast = useToast();
  const { watchlist, recentlyWatched, toggleWatchlist, clearHistory } = useWatchlistStore();

  const remove = (slug: string, title: string) => {
    toggleWatchlist({ slug, title, cover: '' });
    toast('Removed from watchlist', 'info');
  };

  return (
    <div className="px-[clamp(16px,5vw,56px)] py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-s2 border border-[var(--border)] flex items-center justify-center">
          <Bookmark size={18} className="text-s4" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-s5">Watchlist</h1>
          <p className="text-xs text-s3 mt-0.5">{watchlist.length} saved · tracked automatically</p>
        </div>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          <BookmarkX size={56} className="text-s3" />
          <h2 className="font-display font-bold text-lg text-s4">Nothing saved yet</h2>
          <p className="text-sm text-s3 max-w-xs">Click the bookmark on any anime page to save it here.</p>
          <Link href="/" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all">
            Browse Anime
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-10">
          {watchlist.map((item, i) => (
            <motion.div key={item.slug}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.04, ease:[0.16,1,0.3,1], duration:0.4 }}
              className="card-wrap bg-s1 group relative">
              <Link href={`/anime/${item.slug}`}>
                <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
                  <img src={item.cover||`https://picsum.photos/seed/${item.slug}/300/450`} alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e=>{(e.target as HTMLImageElement).src=`https://picsum.photos/seed/${item.slug}/300/450`;}} />
                  <div className="absolute inset-0 bg-s0/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-s5 flex items-center justify-center">
                      <Play size={16} fill="#06141B" className="text-s0 ml-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
              {/* Remove button */}
              <button onClick={() => remove(item.slug, item.title)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s0/80 flex items-center justify-center text-s3 hover:text-s5 hover:bg-s1 transition-all opacity-0 group-hover:opacity-100">
                <X size={11} />
              </button>
              <div className="px-2.5 py-2">
                <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{item.title}</p>
                <p className="text-[9px] text-s3 mt-0.5">{new Date(item.addedAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Continue Watching */}
      {recentlyWatched.length > 0 && (
        <>
          <div className="section-line mb-8" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-s2 border border-[var(--border)] flex items-center justify-center">
                <Clock size={16} className="text-s4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-s5">Continue Watching</h2>
                <p className="text-xs text-s3 mt-0.5">{recentlyWatched.length} anime tracked</p>
              </div>
            </div>
            <button onClick={() => { clearHistory(); toast('History cleared', 'info'); }}
              className="text-xs text-s3 hover:text-s4 transition-colors px-3 py-1.5 rounded-lg hover:bg-s1">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recentlyWatched.map((r, i) => (
              <motion.a key={r.slug}
                href={r.lastEpId ? `/watch/${r.slug}/${r.lastEpId}` : `/anime/${r.slug}`}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.04, ease:[0.16,1,0.3,1], duration:0.4 }}
                className="card-wrap bg-s1 group">
                <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
                  <img src={r.cover||`https://picsum.photos/seed/${r.slug}/300/450`} alt={r.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e=>{(e.target as HTMLImageElement).src=`https://picsum.photos/seed/${r.slug}/300/450`;}} />
                  {r.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-s2">
                      <div className="h-full bg-s5" style={{width:`${r.progress}%`}} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-s0/80 to-transparent" />
                  {r.lastEpNum > 0 && (
                    <div className="absolute bottom-2 left-2 text-[9px] font-mono font-bold text-s4 bg-s0/80 px-1.5 py-0.5 rounded">
                      EP {r.lastEpNum}
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{r.title}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
