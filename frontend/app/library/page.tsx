'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bookmark, BookmarkX, Play, X, Clock, Download, Trash2, FolderOpen, Search, Filter } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useMangaStore } from '@/store/mangaStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/Toast';

type Tab = 'bookmark' | 'history' | 'download' | 'manga-bookmark' | 'manga-history';

export default function LibraryPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { watchlist, recentlyWatched, toggleWatchlist, clearHistory, removeFromHistory } = useWatchlistStore();
  const { getAllBookmarks, getAllProgress, removeProgress, toggleBookmark } = useMangaStore();
  const mangaBookmarks = getAllBookmarks();
  const mangaProgress = getAllProgress();
  const { groups, fetch, remove, removeAnime } = useDownloadStore();

  const [activeTab, setActiveTab] = useState<Tab>('download');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  useEffect(() => { fetch(!!user); }, [user, fetch]);

  const removeBookmark = (slug: string, title: string) => {
    toggleWatchlist({ slug, title, cover: '' });
    toast('Removed from watchlist', 'info');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="pt-8 px-[clamp(16px,5vw,56px)] bg-s0 sticky top-0 z-30 pb-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-white">H</div>
          <h1 className="font-display font-black text-2xl text-s5">Library</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[var(--border)] relative overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
          {(['bookmark', 'history', 'download', 'manga-bookmark', 'manga-history'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold capitalize transition-colors relative shrink-0 ${activeTab === tab ? 'text-accent' : 'text-s3 hover:text-s4'}`}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <motion.div layoutId="libTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-[clamp(16px,5vw,56px)] pt-6">
        {/* Bookmark Tab */}
        {activeTab === 'bookmark' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {watchlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <BookmarkX size={56} className="text-s3" />
                <h2 className="font-display font-bold text-lg text-s4">Nothing saved yet</h2>
                <Link href="/" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all">
                  Browse Anime
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-10">
                {watchlist.map((item, i) => (
                  <motion.div key={item.slug} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} className="card-wrap bg-s1 group relative">
                    <Link href={`/anime/${item.slug}?title=${encodeURIComponent(item.title)}`}>
                      <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute inset-0 bg-s0/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-s5 flex items-center justify-center"><Play size={16} fill="#06141B" className="text-s0 ml-0.5" /></div>
                        </div>
                      </div>
                    </Link>
                    <button onClick={() => removeBookmark(item.slug, item.title)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s0/80 flex items-center justify-center text-s3 hover:text-s5 hover:bg-s1 transition-all opacity-0 group-hover:opacity-100"><X size={11} /></button>
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{item.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {recentlyWatched.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <Clock size={56} className="text-s3" />
                <h2 className="font-display font-bold text-lg text-s4">No history yet</h2>
                <Link href="/" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all">
                  Browse Anime
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-s4 text-sm">Recently Watched</h2>
                  <button onClick={() => { clearHistory(); toast('History cleared', 'info'); }} className="text-xs text-s3 hover:text-red-400 transition-colors">Clear all</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-10">
                  {recentlyWatched.map((r, i) => (
                    <motion.div key={r.slug} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} className="card-wrap bg-s1 group relative">
                      <Link href={r.lastEpId ? `/watch/${r.slug}/${r.lastEpId}?title=${encodeURIComponent(r.title)}&ep=${r.lastEpNum}` : `/anime/${r.slug}?title=${encodeURIComponent(r.title)}`}>
                        <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
                          <img src={r.cover} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          {r.progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-s2"><div className="h-full bg-s5" style={{width:`${r.progress}%`}} /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-s0/80 to-transparent" />
                          {r.lastEpNum > 0 && (
                            <div className="absolute bottom-2 left-2 text-[10px] font-mono font-bold text-accent bg-s0/80 px-1.5 py-0.5 rounded">EP {r.lastEpNum}</div>
                          )}
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{r.title}</p>
                        </div>
                      </Link>
                      <button onClick={(e) => { e.preventDefault(); removeFromHistory(r.slug); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s0/80 flex items-center justify-center text-s3 hover:text-s5 hover:bg-s1 transition-all opacity-0 group-hover:opacity-100 z-10"><X size={11} /></button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Manga Bookmark Tab */}
        {activeTab === 'manga-bookmark' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {mangaBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <BookmarkX size={56} className="text-s3" />
                <h2 className="font-display font-bold text-lg text-s4">No manga saved yet</h2>
                <Link href="/manga" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all">
                  Browse Manga
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-10">
                {mangaBookmarks.map((item, i) => (
                  <motion.div key={item.mangaId} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} className="card-wrap bg-s1 group relative">
                    <Link href={`/manga/read/${item.mangaId}/latest`}>
                      <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
                        <img src={item.coverArt} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute inset-0 bg-s0/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-s5 flex items-center justify-center"><Play size={16} fill="#06141B" className="text-s0 ml-0.5" /></div>
                        </div>
                      </div>
                    </Link>
                    <button onClick={() => { toggleBookmark(item as any); toast('Removed manga', 'info'); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s0/80 flex items-center justify-center text-s3 hover:text-s5 hover:bg-s1 transition-all opacity-0 group-hover:opacity-100"><X size={11} /></button>
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{item.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Manga History Tab */}
        {activeTab === 'manga-history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {mangaProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <Clock size={56} className="text-s3" />
                <h2 className="font-display font-bold text-lg text-s4">No manga history yet</h2>
                <Link href="/manga" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all">
                  Browse Manga
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-s4 text-sm">Recently Read Manga</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-10">
                  {mangaProgress.map((r, i) => (
                    <motion.div key={r.mangaId} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} className="card-wrap bg-s1 group relative">
                      <Link href={`/manga/read/${r.mangaId}/${r.chapterId}`}>
                        <div className="relative overflow-hidden" style={{aspectRatio:'2/3'}}>
                          <img src={r.coverArt} alt={r.mangaTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          {r.totalPages > 1 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-s2"><div className="h-full bg-s5" style={{width:`${Math.min(100, (r.page/r.totalPages)*100)}%`}} /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-s0/80 to-transparent" />
                          {r.chapterNum && (
                            <div className="absolute bottom-2 left-2 text-[10px] font-mono font-bold text-accent bg-s0/80 px-1.5 py-0.5 rounded">CH {r.chapterNum}</div>
                          )}
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="text-[11px] font-semibold text-s4 line-clamp-2 leading-tight">{r.mangaTitle}</p>
                        </div>
                      </Link>
                      <button onClick={(e) => { e.preventDefault(); removeProgress(r.mangaId); toast('Removed from history', 'info'); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s0/80 flex items-center justify-center text-s3 hover:text-s5 hover:bg-s1 transition-all opacity-0 group-hover:opacity-100 z-10"><X size={11} /></button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Download Tab */}
        {activeTab === 'download' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
                <FolderOpen size={56} className="text-s3" />
                <h2 className="font-display font-bold text-lg text-s4">No downloads yet</h2>
                <p className="text-sm text-s3 max-w-xs">Episodes you save will appear here, grouped by anime.</p>
                <Link href="/" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all">Browse Anime</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-s5 text-lg">Download List</h2>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-s3/40 text-s4 text-xs font-bold hover:bg-s1 transition-colors"><Filter size={14}/> All</button>
                    <button className="text-s4 hover:text-s5"><Search size={20}/></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {groups.map((group, i) => (
                    <motion.div key={group.anime_slug} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} 
                      className="group cursor-pointer" onClick={() => setSelectedGroup(group)}>
                      <div className="relative overflow-hidden rounded-xl bg-s2 mb-2 shadow-lg" style={{aspectRatio:'2/3'}}>
                        <img src={group.anime_cover} alt={group.anime_title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-accent text-white text-[10px] font-bold rounded shadow-md">
                          {group.episodes.length} Episode{group.episodes.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-s5 line-clamp-1">{group.anime_title || group.anime_slug}</p>
                      <p className="text-[11px] text-s3">Anime</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Download Episodes Bottom Sheet */}
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGroup(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative bg-[#1A1A1A] rounded-t-[32px] w-full max-h-[85vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
              
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={selectedGroup.anime_cover} alt="" className="w-14 h-14 rounded-lg object-cover bg-s2" />
                  <div>
                    <h3 className="font-bold text-white text-base line-clamp-1">{selectedGroup.anime_title}</h3>
                    <p className="text-xs font-bold text-accent">{selectedGroup.episodes.length} Episode{selectedGroup.episodes.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/70">
                  <button className="hover:text-white"><Search size={22}/></button>
                  <button onClick={() => { removeAnime(selectedGroup.anime_slug, !!user); setSelectedGroup(null); toast('All removed', 'info'); }} className="hover:text-red-400"><Trash2 size={22}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {selectedGroup.episodes.map((ep: any) => (
                  <div key={ep.id} className="flex items-center gap-4 bg-[#2A2A2A] rounded-2xl p-3 border border-white/5 relative group cursor-pointer hover:bg-[#333] transition-colors">
                    <Link href={`/watch/${selectedGroup.anime_slug}/${ep.episode_id}?title=${encodeURIComponent(selectedGroup.anime_title||'')}&ep=${ep.episode_num}`}
                      className="absolute inset-0 z-10" />
                    <div className="w-[100px] h-[56px] rounded-lg bg-[#1A1A1A] overflow-hidden shrink-0 relative flex items-center justify-center border border-white/10">
                       <span className="text-[10px] font-bold text-white/50">EP {ep.episode_num}</span>
                    </div>
                    <div className="flex-1 z-20 pointer-events-none">
                      <p className="font-bold text-white text-sm line-clamp-1">{ep.episode_title || `Episode ${ep.episode_num}`}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-accent">480P</span>
                        <span className="text-[10px] text-white/40 font-mono">62 MB</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); remove(selectedGroup.anime_slug, ep.id, !!user); toast('Removed', 'info'); }} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-red-400 z-20 shrink-0"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
