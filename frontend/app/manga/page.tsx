'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Flame, Clock, Grid } from 'lucide-react';
import MangaHero from '@/components/manga/MangaHero';
import MangaGrid from '@/components/manga/MangaGrid';
import { MangaHeroSkeleton, MangaCardSkeleton } from '@/components/manga/MangaSkeletons';
import { getProvider } from '@/lib/manga/providers';
import type { MangaResult } from '@/lib/manga/types';
import Link from 'next/link';

export default function MangaHome() {
  const [trending, setTrending] = useState<MangaResult[]>([]);
  const [latest, setLatest] = useState<MangaResult[]>([]);
  const [popular, setPopular] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const provider = getProvider('mangadex');
    
    Promise.allSettled([
      provider.getTrending?.() || provider.search('', { sortBy: 'relevance' }),
      provider.getLatest?.() || provider.search('', { sortBy: 'latestUploadedChapter' }),
      provider.search('', { sortBy: 'followedCount', limit: 30 }) // Fallback for popular
    ]).then(([t, l, p]) => {
      if (t.status === 'fulfilled') setTrending(t.value);
      if (l.status === 'fulfilled') setLatest(l.value);
      if (p.status === 'fulfilled') setPopular(p.value);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-s0 pb-24">
        <MangaHeroSkeleton />
        <div className="px-[clamp(16px,5vw,56px)] pt-12">
          <div className="w-48 h-6 rounded skeleton mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
             {Array.from({length: 14}).map((_, i) => <MangaCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const heroManga = trending[0] || popular[0];

  return (
    <div className="min-h-screen bg-s0 pb-24">
      {/* Brand Header for MangaVerse */}
      <div className="absolute top-0 left-0 right-0 h-16 z-50 px-[clamp(16px,5vw,56px)] flex items-center bg-gradient-to-b from-s0/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <BookOpen className="text-accent" size={24} />
          <span className="font-orbitron font-bold text-xl text-white tracking-wider drop-shadow-md">
            MANGA<span className="text-accent">VERSE</span>
          </span>
        </div>
      </div>

      {heroManga && <MangaHero manga={heroManga} />}

      <div className="px-[clamp(16px,5vw,56px)] pt-12 flex flex-col gap-12">
        {/* Trending Section */}
        {trending.length > 1 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="text-accent" size={24} />
              <h2 className="font-display font-black text-2xl text-s5 uppercase tracking-wide">Trending Now</h2>
            </div>
            <MangaGrid initialData={trending.slice(1, 15)} />
          </section>
        )}

        {/* Latest Updates Section */}
        {latest.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="text-accent" size={24} />
                <h2 className="font-display font-black text-2xl text-s5 uppercase tracking-wide">Latest Updates</h2>
              </div>
            </div>
            <MangaGrid initialData={latest.slice(0, 14)} />
          </section>
        )}

        {/* Popular Section (Infinite Scroll potential here) */}
        {popular.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Grid className="text-accent" size={24} />
              <h2 className="font-display font-black text-2xl text-s5 uppercase tracking-wide">Most Popular</h2>
            </div>
            <MangaGrid 
              initialData={popular.slice(0, 20)} 
              hasMore={true}
              fetchMore={async (page) => {
                const p = getProvider('mangadex');
                return await p.search('', { sortBy: 'followedCount', limit: 20, page });
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
