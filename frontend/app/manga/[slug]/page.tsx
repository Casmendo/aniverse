'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Heart, BookOpen, Users, Clock, ExternalLink, Globe, BarChart2 } from 'lucide-react';
import { unifiedMangaService } from '@/lib/manga/unifiedService';
import type { UnifiedManga } from '@/lib/manga/unifiedTypes';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/manga/unifiedTypes';
import type { MDXChapter } from '@/lib/manga/mangaDexClient';
import { useMangaStore } from '@/store/mangaStore';
import CharacterSlider from '@/components/manga/CharacterSlider';
import MangaChapterList from '@/components/manga/MangaChapterList';

// ── Skeletons ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #f8fafc 0%, #ffffff 40%)' }}>
      <div className="skeleton h-[45vw] max-h-[340px] min-h-[220px]" />
      <div className="px-4 pt-4 flex gap-4">
        <div className="skeleton w-28 rounded-xl shrink-0" style={{ aspectRatio: '2/3' }} />
        <div className="flex-1 space-y-3 pt-2">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      </div>
      <div className="px-4 pt-8 space-y-3">
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    </div>
  );
}

type Tab = 'chapters' | 'info' | 'characters' | 'related';

export default function MangaDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const anilistId = parseInt(params.slug, 10);

  const [manga, setManga] = useState<UnifiedManga | null>(null);
  const [chapters, setChapters] = useState<MDXChapter[]>([]);
  const [loadingManga, setLoadingManga] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('chapters');

  const isBookmarked = useMangaStore(s => manga ? s.isBookmarked(String(manga.anilistId)) : false);
  const progress = useMangaStore(s => manga ? s.getProgress(String(manga.anilistId)) : null);

  useEffect(() => {
    if (isNaN(anilistId)) { setError('Invalid manga'); setLoadingManga(false); return; }

    unifiedMangaService.getDetail(anilistId)
      .then(async (data) => {
        setManga(data);
        document.title = `${data.title} — MangaVerse`;

        // Fetch chapters in background after manga loads
        if (data.mangaDexId) {
          setLoadingChapters(true);
          try {
            const chaps = await unifiedMangaService.getChapters(data);
            setChapters(chaps);
          } catch (e) {
            console.error('Chapter fetch failed:', e);
          } finally {
            setLoadingChapters(false);
          }
        }
      })
      .catch(() => setError('Failed to load manga. Please try again.'))
      .finally(() => setLoadingManga(false));
  }, [anilistId]);

  if (loadingManga) return <Skeleton />;
  if (error || !manga) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: '#ffffff' }}>
      <BookOpen size={48} className="text-blue-800" />
      <p className="text-slate-600 font-bold">{error || 'Manga not found'}</p>
      <button onClick={() => router.back()} className="px-5 py-2 rounded-xl bg-blue-100 border border-blue-300 text-sm font-bold text-blue-700">Go Back</button>
    </div>
  );

  const statusStyle = STATUS_COLORS[manga.status] || STATUS_COLORS.UNKNOWN;
  const firstChapter = chapters[0];
  const idStr = String(manga.anilistId);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'chapters',   label: 'Chapters',   count: chapters.length > 0 ? chapters.length : manga.totalChapters || undefined },
    { key: 'info',       label: 'Info'       },
    { key: 'characters', label: 'Characters', count: manga.characters.length || undefined },
    { key: 'related',    label: 'Related'    },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #f8fafc 0%, #ffffff 40%)' }}>
      {/* Back Button */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button onClick={() => router.back()}
          className="pointer-events-auto w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-white/10 flex items-center justify-center text-slate-900 hover:bg-black/90 transition-colors">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Banner */}
      <div className="relative h-[50vw] max-h-[360px] min-h-[240px] overflow-hidden">
        {(manga.bannerImage || manga.coverImage) ? (
          <img src={manga.bannerImage || manga.coverImage} alt=""
            className="w-full h-full object-cover object-top"
            style={{ filter: 'brightness(0.35) saturate(1.3)' }} />
        ) : (
          <div className="w-full h-full" style={{ background: manga.color ? `linear-gradient(135deg, ${manga.color}33, #ffffff)` : 'linear-gradient(135deg, #f1f5f9, #ffffff)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#ffffff] via-[#ffffff]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
      </div>

      {/* Cover + Title Row */}
      <div className="relative px-4 -mt-24 z-10 flex gap-4 items-end">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="w-28 md:w-36 shrink-0 rounded-xl overflow-hidden border-2 border-blue-300 shadow-2xl"
          style={{ aspectRatio: '2/3' }}>
          <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 pb-1">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>
              {STATUS_LABELS[manga.status]}
            </span>
            {manga.format !== 'MANGA' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">{manga.format}</span>
            )}
          </div>
          <h1 className="font-black text-slate-900 text-xl md:text-3xl leading-tight line-clamp-3 drop-shadow-lg">{manga.title}</h1>
          {manga.titleNative && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{manga.titleNative}</p>}
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold">
        {manga.rating > 0 && (
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Star size={13} fill="currentColor" /> {(manga.rating / 10).toFixed(1)} <span className="text-slate-600 font-normal">/ 10</span>
          </div>
        )}
        {manga.popularity > 0 && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <BarChart2 size={13} /> {manga.popularity.toLocaleString()} followers
          </div>
        )}
        {(chapters.length > 0 || manga.totalChapters) && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <BookOpen size={13} /> {chapters.length > 0 ? chapters.length : manga.totalChapters} chapters
          </div>
        )}
        {manga.releaseYear && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock size={13} /> {manga.releaseYear}
          </div>
        )}
      </div>

      {/* Genres */}
      <div className="px-4 mt-3 flex flex-wrap gap-1.5">
        {manga.genres.slice(0, 6).map(g => (
          <Link key={g} href={`/manga/discover?genre=${encodeURIComponent(g)}`}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-red-500/20 hover:bg-blue-500/20 transition-colors">
            {g}
          </Link>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-5 flex flex-wrap items-center gap-3">
        {firstChapter && (
          <Link href={firstChapter.externalUrl || `/manga/${manga.anilistId}/reader/${firstChapter.id}`}
            target={firstChapter.externalUrl ? '_blank' : '_self'}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-[0_0_24px_rgba(37,99,235,0.4)]">
            <BookOpen size={16} />
            {progress ? `Resume Ch ${progress.chapterNum}` : 'Start Reading'}
          </Link>
        )}
        {progress && firstChapter && (
          <Link href={firstChapter.externalUrl || `/manga/${manga.anilistId}/reader/${firstChapter.id}`}
            target={firstChapter.externalUrl ? '_blank' : '_self'}
            className="flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-100 transition-colors">
            Ch 1
          </Link>
        )}
        <button
          onClick={() => useMangaStore.getState().toggleBookmark({
            id: idStr, title: manga.title, coverArt: manga.coverImage, status: 'ongoing',
          })}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm border transition-all ${
            isBookmarked
              ? 'bg-blue-600 border-blue-600 text-slate-900'
              : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          {isBookmarked ? 'Saved' : 'Save'}
        </button>
        {!manga.mangaDexId && (
          <span className="text-[10px] text-slate-600 font-bold px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">Not on MangaDex</span>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-7 flex gap-0.5 border-b border-blue-200">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === key
                ? 'text-blue-600 border-b-2 border-red-500 -mb-px'
                : 'text-slate-600 hover:text-slate-600'
            }`}>
            {label}{count ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      <div className="px-4 pt-5">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
              <MangaChapterList
                mangaId={idStr}
                mangaTitle={manga.title}
                chapters={chapters}
                loading={loadingChapters}
              />
            )}

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {manga.description && (
                  <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Synopsis</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{manga.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Status',   value: STATUS_LABELS[manga.status] },
                    { label: 'Format',   value: manga.format },
                    { label: 'Year',     value: manga.releaseYear || '—' },
                    { label: 'Volumes',  value: manga.volumes || '—' },
                    { label: 'Chapters', value: chapters.length > 0 ? Math.max(chapters.length, manga.totalChapters || 0) : manga.totalChapters || '—' },
                    { label: 'Origin',   value: manga.countryOfOrigin },
                    { label: 'Source',   value: manga.source || '—' },
                    { label: 'Score',    value: manga.rating ? `${(manga.rating / 10).toFixed(2)} / 10` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                {manga.tags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {manga.tags.slice(0, 24).map(t => (
                        <span key={t.name} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-slate-500">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Characters Tab */}
            {activeTab === 'characters' && (
              manga.characters.length > 0
                ? <CharacterSlider characters={manga.characters} />
                : <div className="text-center py-12 text-slate-600">No character data available</div>
            )}

            {/* Related Tab */}
            {activeTab === 'related' && (
              <div className="space-y-8">
                {manga.relations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Related Works</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {manga.relations.map((r, i) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <Link href={`/manga/${r.id}`} className="block rounded-xl overflow-hidden border border-blue-200 hover:border-blue-400 transition-all group">
                            <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                              {r.coverImage
                                ? <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <div className="w-full h-full bg-blue-50 flex items-center justify-center"><BookOpen className="text-blue-800" /></div>
                              }
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/90 text-blue-600 border border-blue-300">
                                {r.type.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <div className="p-2 bg-white">
                              <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 line-clamp-2">{r.title}</p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {manga.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Recommended</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {manga.recommendations.map((r, i) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <Link href={`/manga/${r.id}`} className="block rounded-xl overflow-hidden border border-blue-200 hover:border-blue-400 transition-all group">
                            <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                              {r.coverImage
                                ? <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <div className="w-full h-full bg-blue-50" />
                              }
                              {r.score > 0 && (
                                <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/90 text-yellow-400 text-[10px] font-bold">
                                  <Star size={9} fill="currentColor" /> {(r.score / 10).toFixed(1)}
                                </div>
                              )}
                            </div>
                            <div className="p-2 bg-white">
                              <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 line-clamp-2">{r.title}</p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {manga.relations.length === 0 && manga.recommendations.length === 0 && (
                  <div className="text-center py-12 text-slate-600">No related works found</div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
