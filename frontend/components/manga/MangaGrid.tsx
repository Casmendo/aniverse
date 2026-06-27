import React, { useEffect, useRef, useState } from 'react';
import MangaCard from './MangaCard';
import { MangaCardSkeleton } from './MangaSkeletons';
import type { MangaResult } from '../../lib/manga/types';
import { Loader2 } from 'lucide-react';

interface MangaGridProps {
  initialData: MangaResult[];
  fetchMore?: (page: number) => Promise<MangaResult[]>;
  hasMore?: boolean;
}

export default function MangaGrid({ initialData, fetchMore, hasMore = false }: MangaGridProps) {
  const [items, setItems] = useState<MangaResult[]>(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(hasMore);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialData);
    setPage(1);
    setCanLoadMore(hasMore);
  }, [initialData, hasMore]);

  useEffect(() => {
    if (!fetchMore || !canLoadMore || loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchMore, canLoadMore, loading, page]);

  const loadNextPage = async () => {
    if (!fetchMore) return;
    setLoading(true);
    try {
      const nextData = await fetchMore(page + 1);
      if (nextData.length === 0) {
        setCanLoadMore(false);
      } else {
        // Prevent duplicates
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = nextData.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setPage(p => p + 1);
      }
    } catch (err) {
      console.error('Failed to load more manga:', err);
      setCanLoadMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {items.map((manga, i) => (
          <MangaCard key={manga.id} manga={manga} index={i % 20} priority={i < 10} />
        ))}
        {loading && (
          Array.from({ length: 6 }).map((_, i) => <MangaCardSkeleton key={`skel-${i}`} />)
        )}
      </div>
      
      {canLoadMore && (
        <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-4">
          {loading && <Loader2 size={24} className="animate-spin text-accent" />}
        </div>
      )}
    </div>
  );
}
