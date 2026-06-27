'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { animeAPI } from '@/lib/api';
import AnimeSection from '@/components/AnimeSection';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/Toast';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const toast = useToast();
  const { user } = useAuthStore();
  const { toggleWatchlist, watchlist } = useWatchlistStore();
  const { add: addDownload } = useDownloadStore();

  const [results, setResults] = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    animeAPI.search(q)
      .then(({ data }) => {
        const items = Array.isArray(data)
          ? data
          : data.results || data.data || data.anime || [];
        setResults(items);
      })
      .catch(() => {
        setResults([]);
        toast('Failed to search', 'error');
      })
      .finally(() => setLoading(false));
  }, [q, toast]);

  const handleWatchlist = (slug: string, title: string, cover: string) => {
    const added = toggleWatchlist({ slug, title, cover });
    toast(added ? 'Added to watchlist' : 'Removed from watchlist', 'info');
  };

  const handleDownload = async (slug: string, title: string, cover: string) => {
    const result = await addDownload({
      anime_slug:slug, anime_title:title, anime_cover:cover,
      episode_num:1, episode_id:'1', episode_title:'Episode 1',
    }, !!user);
    if (result.duplicate) toast('Already in your library', 'info');
    else if (result.success) toast(`${title} EP 1 saved!`, 'success');
  };

  const watchedSlugs = new Set(watchlist.map(w => w.slug));

  return (
    <div className="min-h-screen pt-20">
      <div className="px-[clamp(16px,4vw,56px)] mb-6">
        <h1 className="font-display font-bold text-2xl text-s5 mb-2">Search Results</h1>
        <p className="text-s4 text-sm">
          {q ? `Showing results for "${q}"` : 'Enter a search query'}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="text-s4 animate-spin" />
          <p className="text-s4 text-sm">Searching for "{q}"...</p>
        </div>
      ) : results.length > 0 ? (
        <AnimeSection 
          title={`Found ${results.length} results`} 
          icon={<SearchIcon size={14} className="text-s4" />}
          items={results} 
          watchedSlugs={watchedSlugs}
          onDownload={handleDownload} 
          onWatchlist={handleWatchlist} 
        />
      ) : q ? (
        <div className="px-[clamp(16px,4vw,56px)] py-10 text-center border border-dashed border-s2 mx-[clamp(16px,4vw,56px)] rounded-3xl bg-s1/30">
          <p className="text-s4 text-lg">No results found for "{q}"</p>
          <p className="text-s3 text-sm mt-2">Try a different keyword.</p>
        </div>
      ) : null}
    </div>
  );
}
