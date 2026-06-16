'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Filter } from 'lucide-react';
import { getProvider } from '@/lib/manga/providers';
import type { MangaResult } from '@/lib/manga/types';
import MangaGrid from '@/components/manga/MangaGrid';
import { MangaHeroSkeleton, MangaCardSkeleton } from '@/components/manga/MangaSkeletons';

export default function MangaGenrePage({ params, searchParams }: { params: { genre: string }; searchParams: { name?: string } }) {
  const router = useRouter();
  const [mangaList, setMangaList] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  const genreId = params.genre;
  const genreName = searchParams.name || 'Genre';

  useEffect(() => {
    const fetchGenre = async () => {
      try {
        const provider = getProvider('mangadex');
        const results = await provider.getByGenre?.(genreId, 1);
        setMangaList(results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGenre();
  }, [genreId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-s0 pt-24 px-[clamp(16px,5vw,56px)]">
        <div className="w-48 h-8 rounded skeleton mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
           {Array.from({length: 14}).map((_, i) => <MangaCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s0 pb-24">
      {/* Header Back Button */}
      <div className="sticky top-0 left-0 right-0 h-16 z-30 px-[clamp(16px,5vw,56px)] flex items-center bg-s0/90 backdrop-blur-md border-b border-[var(--border)] gap-4">
        <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-s2 text-s5 hover:text-slate-900 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display font-black text-xl text-s5 uppercase tracking-wider flex items-center gap-2">
          <Filter size={18} className="text-accent" />
          {genreName}
        </h1>
      </div>

      <div className="px-[clamp(16px,5vw,56px)] pt-8">
        <MangaGrid 
          initialData={mangaList} 
          hasMore={true}
          fetchMore={async (page) => {
            const p = getProvider('mangadex');
            return (await p.getByGenre?.(genreId, page)) || [];
          }}
        />
      </div>
    </div>
  );
}
