'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Heart, BookOpen, Users, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { mangaService, type AniMangaDetail } from '@/lib/manga/mangaService';
import { useMangaStore } from '@/store/mangaStore';
import ChapterList from '@/components/manga/ChapterList';

function DetailSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #0f0204 0%, #06141B 40%)' }}>
      <div className="skeleton h-[45vh]" />
      <div className="px-4 pt-6 space-y-4">
        <div className="skeleton h-8 w-3/4 rounded-xl" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function MangaDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const id = parseInt(params.slug, 10);
  const [manga, setManga] = useState<AniMangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'characters' | 'related'>('info');

  const isBookmarked = useMangaStore(s => manga ? s.isBookmarked(String(manga.id)) : false);
  const progress = useMangaStore(s => manga ? s.getProgress(String(manga.id)) : null);

  useEffect(() => {
    if (isNaN(id)) { setError('Invalid manga ID'); setLoading(false); return; }
    mangaService.getDetail(id)
      .then(data => { setManga(data); document.title = `${data.title} – MangaVerse`; })
      .catch(() => setError('Failed to load manga details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (error || !manga) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: '#06141B' }}>
      <AlertCircle size={48} className="text-red-500" />
      <p className="text-slate-400">{error || 'Manga not found'}</p>
      <button onClick={() => router.back()} className="px-5 py-2 rounded-xl bg-red-900/30 border border-red-800/30 text-sm font-bold text-red-300 hover:bg-red-900/50">
        Go Back
      </button>
    </div>
  );

  const statusColor: Record<string, string> = {
    RELEASING: 'text-green-400', FINISHED: 'text-blue-400', NOT_YET_RELEASED: 'text-yellow-400',
  };
  const statusLabel: Record<string, string> = { RELEASING: 'Ongoing', FINISHED: 'Completed', NOT_YET_RELEASED: 'Upcoming' };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'radial-gradient(ellipse at top, #0f0204 0%, #06141B 40%)' }}>
      {/* Back button */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button
          onClick={() => router.back()}
          className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Banner / Hero */}
      <div className="relative h-[55vw] max-h-[380px] min-h-[260px]">
        {(manga.bannerImage || manga.coverImage) ? (
          <img
            src={manga.bannerImage || manga.coverImage}
            alt=""
            className="w-full h-full object-cover object-top"
            style={{ filter: 'brightness(0.4) saturate(1.2)' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06141B] via-[#06141B]/40 to-transparent" />
      </div>

      {/* Cover + Title */}
      <div className="relative px-4 -mt-24 flex gap-4 items-end z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-28 md:w-36 shrink-0 rounded-xl overflow-hidden border-2 border-red-900/40 shadow-2xl"
          style={{ aspectRatio: '2/3' }}
        >
          <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 pb-1">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {manga.genres.slice(0, 3).map(g => (
              <Link key={g} href={`/manga/discover?genre=${encodeURIComponent(g)}`}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors">
                {g}
              </Link>
            ))}
          </div>
          <h1 className="font-black text-white text-lg md:text-2xl leading-tight line-clamp-3 drop-shadow-lg">{manga.title}</h1>
          {manga.titleNative && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{manga.titleNative}</p>}
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mt-4 flex flex-wrap items-center gap-4 text-xs font-bold">
        {manga.averageScore > 0 && (
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={14} fill="currentColor" />
            <span>{(manga.averageScore / 10).toFixed(1)}</span>
          </div>
        )}
        {manga.popularity > 0 && (
          <div className="flex items-center gap-1 text-slate-400">
            <Users size={14} /> {manga.popularity.toLocaleString()}
          </div>
        )}
        {manga.chapters && (
          <div className="flex items-center gap-1 text-slate-400">
            <BookOpen size={14} /> {manga.chapters} Chapters
          </div>
        )}
        {manga.startDate && (
          <div className={`flex items-center gap-1 ${statusColor[manga.status] || 'text-slate-400'}`}>
            <Clock size={14} /> {statusLabel[manga.status] || manga.status}
            {manga.startDate && ` · ${manga.startDate}`}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-4 flex items-center gap-3">
        {progress ? (
          <Link href={`/manga/read/${manga.id}/${progress.chapterId}`}
            className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-red-600 text-white hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(225,29,72,0.4)]">
            <BookOpen size={16} /> Resume Ch {progress.chapterNum}
          </Link>
        ) : null}

        <button
          onClick={() => useMangaStore.getState().toggleBookmark(manga as any)}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm border transition-all ${
            isBookmarked
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-red-950/20 border-red-900/30 text-red-300 hover:bg-red-900/30 hover:border-red-700/50'
          }`}
        >
          <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          {isBookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6 flex gap-1 border-b border-red-950/30 pb-px">
        {(['info', 'characters', 'related'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all capitalize ${
              activeTab === tab
                ? 'text-red-400 border-b-2 border-red-500 -mb-px'
                : 'text-slate-600 hover:text-slate-400'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 pt-5">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {manga.description && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Synopsis</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{manga.description}</p>
              </div>
            )}

            {manga.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {manga.tags.slice(0, 20).map(t => (
                    <span key={t.name} className="px-2.5 py-1 rounded-lg bg-red-950/20 border border-red-900/20 text-[11px] font-bold text-slate-400">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters list using existing ChapterList component */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Chapters</h3>
              <p className="text-sm text-slate-500 bg-red-950/10 border border-red-900/15 rounded-xl p-4">
                AniList provides metadata only. To read chapters, a chapter provider integration is needed. {manga.chapters ? `This series has ${manga.chapters} chapters.` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {manga.characters.map((c, i) => (
                <motion.div key={c.character.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-red-950/10 border border-red-900/15 rounded-xl p-3 flex flex-col items-center text-center gap-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-red-950/30 border border-red-900/20">
                    {c.character.image
                      ? <img src={c.character.image} alt={c.character.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-red-700 font-bold">{c.character.name[0]}</div>
                    }
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 line-clamp-1">{c.character.name}</p>
                    <p className="text-[10px] text-red-500/60 font-bold uppercase">{c.role}</p>
                  </div>
                  {c.voiceActors[0] && (
                    <div className="flex items-center gap-1.5 w-full pt-2 border-t border-red-950/30">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-red-950/30 shrink-0">
                        {c.voiceActors[0].image
                          ? <img src={c.voiceActors[0].image} alt={c.voiceActors[0].name} className="w-full h-full object-cover" />
                          : null
                        }
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{c.voiceActors[0].name}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              {manga.characters.length === 0 && (
                <p className="text-slate-600 text-sm col-span-full text-center py-8">No character data available</p>
              )}
            </div>
          </div>
        )}

        {/* Related Tab */}
        {activeTab === 'related' && (
          <div className="space-y-8">
            {/* Related */}
            {manga.relations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Related Works</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {manga.relations.map((r, i) => (
                    <Link key={r.id} href={`/manga/${r.id}`}
                      className="flex gap-2 items-center p-2.5 rounded-xl bg-red-950/10 border border-red-900/15 hover:border-red-800/30 transition-all group">
                      {r.cover && (
                        <div className="w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-red-950/20">
                          <img src={r.cover} alt={r.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-wider mb-0.5">{r.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-bold text-slate-300 group-hover:text-white line-clamp-2">{r.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {manga.recommendations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recommendations</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {manga.recommendations.map((r, i) => (
                    <Link key={r.id} href={`/manga/${r.id}`}
                      className="block rounded-xl overflow-hidden border border-red-900/15 hover:border-red-800/30 transition-all group">
                      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                        {r.cover && <img src={r.cover} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                        {r.score > 0 && (
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 text-yellow-400 text-[10px] font-bold">
                            <Star size={9} fill="currentColor" /> {(r.score/10).toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-[#0d0505]">
                        <p className="text-xs font-bold text-slate-300 group-hover:text-white line-clamp-2">{r.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {manga.relations.length === 0 && manga.recommendations.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-8">No related works found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
