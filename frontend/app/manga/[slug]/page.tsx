'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Users, BookOpen, Clock, AlertCircle, Share2, Bookmark } from 'lucide-react';
import { getProvider } from '@/lib/manga/providers';
import type { MangaDetail, Chapter } from '@/lib/manga/types';
import ChapterList from '@/components/manga/ChapterList';
import { useMangaStore } from '@/store/mangaStore';
import { MangaHeroSkeleton } from '@/components/manga/MangaSkeletons';

export default function MangaDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isBookmarked = useMangaStore(state => manga ? state.isBookmarked(manga.id) : false);
  const progress = useMangaStore(state => manga ? state.getProgress(manga.id) : null);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const provider = getProvider('mangadex');
        const [detail, chaps] = await Promise.all([
          provider.getDetail(params.slug),
          provider.getChapters(params.slug, { limit: 500, sortOrder: 'desc' }) // fetch recent first
        ]);
        setManga(detail);
        setChapters(chaps);
      } catch (err: any) {
        console.error('Failed to load manga:', err);
        setError('Failed to load manga details. It might be unavailable or removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchManga();
  }, [params.slug]);

  if (loading) return <div className="min-h-screen bg-s0"><MangaHeroSkeleton /></div>;
  if (error || !manga) return (
    <div className="min-h-screen bg-s0 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-s5 mb-2">Oops!</h1>
      <p className="text-s4 mb-6">{error || 'Manga not found'}</p>
      <button onClick={() => router.back()} className="px-6 py-2 rounded-xl bg-s2 hover:bg-s3 text-s5 transition-colors font-bold">
        Go Back
      </button>
    </div>
  );

  const author = manga.authors.find(a => a.role === 'author')?.name || 'Unknown Author';
  const artist = manga.authors.find(a => a.role === 'artist')?.name;
  const primaryGenre = manga.tags.find(t => t.group === 'genre')?.name || 'Manga';

  return (
    <div className="min-h-screen bg-s0 pb-24">
      {/* Header Back Button */}
      <div className="fixed top-0 left-0 right-0 h-16 z-50 px-[clamp(16px,5vw,56px)] flex items-center bg-gradient-to-b from-s0/90 to-transparent pointer-events-none">
        <button onClick={() => router.back()} className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-s1/80 backdrop-blur-md border border-[var(--border)] text-s5 hover:text-white hover:bg-s2 transition-colors">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative w-full min-h-[40vh] md:min-h-[50vh] bg-s1 border-b border-[var(--border)] overflow-hidden">
        <div className="absolute inset-0">
          <img src={manga.coverArt} alt="" className="w-full h-full object-cover opacity-20 blur-xl saturate-150 scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-s0 via-s0/80 to-transparent" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-[clamp(16px,5vw,56px)] pt-20 pb-8 h-full flex flex-col md:flex-row items-end gap-6 md:gap-10">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-32 md:w-56 shrink-0 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 md:-mb-16 z-10 mx-auto md:mx-0">
            <img src={manga.coverArt} alt={manga.title} className="w-full h-full object-cover" />
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 text-center md:text-left z-10 pb-4 md:pb-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent text-white">
                {manga.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-s2 text-s5 border border-[var(--border)]">
                {manga.contentRating}
              </span>
              {manga.year && (
                <span className="text-[10px] font-mono font-bold text-s4">{manga.year}</span>
              )}
            </div>

            <h1 className="font-display font-black text-2xl md:text-4xl lg:text-5xl text-white mb-2 leading-tight drop-shadow-md">
              {manga.title}
            </h1>
            <p className="text-sm md:text-base font-bold text-s4 mb-4">
              By {author} {artist && artist !== author ? ` & ${artist}` : ''}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
               <button onClick={() => useMangaStore.getState().toggleBookmark(manga)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${isBookmarked ? 'bg-accent text-white' : 'bg-s2 text-s5 hover:bg-s3'}`}>
                 <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                 {isBookmarked ? 'Saved to Library' : 'Add to Library'}
               </button>
               
               {progress && (
                 <Link href={`/manga/read/${manga.id}/${progress.chapterId}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-s5 to-s4 text-s0 transition-opacity hover:opacity-90 shadow-md">
                   Continue Ch {progress.chapterNum}
                 </Link>
               )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-[clamp(16px,5vw,56px)] pt-12 md:pt-20 flex flex-col lg:flex-row gap-10">
        
        {/* Left Col: Details */}
        <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-8">
          <div className="p-5 rounded-2xl bg-s1 border border-[var(--border)]">
            <h3 className="text-xs font-bold text-s3 uppercase tracking-widest mb-3">Synopsis</h3>
            <p className="text-sm text-s4 leading-relaxed whitespace-pre-wrap">
              {manga.description || 'No synopsis provided.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-s3 uppercase tracking-widest mb-3">Tags & Genres</h3>
            <div className="flex flex-wrap gap-2">
              {manga.tags.map(t => (
                <Link key={t.id} href={`/manga/genre/${t.id}?name=${encodeURIComponent(t.name)}`} className="px-2.5 py-1 rounded-lg bg-s2 border border-[var(--border)] text-xs font-bold text-s5 hover:bg-s3 transition-colors">
                  {t.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 rounded-xl bg-s1 border border-[var(--border)] flex flex-col items-center text-center">
               <Star size={20} className="text-yellow-500 mb-2" />
               <span className="text-[10px] font-bold text-s4 uppercase tracking-widest mb-0.5">Rating</span>
               <span className="text-sm font-black text-s5">{manga.rating ? manga.rating.toFixed(2) : 'N/A'}</span>
             </div>
             <div className="p-4 rounded-xl bg-s1 border border-[var(--border)] flex flex-col items-center text-center">
               <BookOpen size={20} className="text-accent mb-2" />
               <span className="text-[10px] font-bold text-s4 uppercase tracking-widest mb-0.5">Chapters</span>
               <span className="text-sm font-black text-s5">{manga.chapterCount || chapters.length || '?'}</span>
             </div>
          </div>

          {manga.relatedManga?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-s3 uppercase tracking-widest mb-3">Related Manga</h3>
              <div className="flex flex-col gap-3">
                {manga.relatedManga.slice(0, 5).map(rm => (
                  <Link key={rm.id} href={`/manga/${rm.id}`} className="p-3 rounded-xl bg-s1 border border-[var(--border)] hover:border-accent transition-colors flex flex-col">
                    <span className="text-[10px] text-accent font-bold uppercase mb-0.5">{rm.relation}</span>
                    <span className="text-sm font-bold text-s5 line-clamp-1">{rm.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Chapters */}
        <div className="flex-1 min-w-0">
          <ChapterList mangaId={manga.id} mangaTitle={manga.title} chapters={chapters} />
        </div>
      </div>
    </div>
  );
}
