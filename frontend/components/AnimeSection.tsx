'use client';
import AnimeCard, { AnimeCardSkeleton } from './AnimeCard';
import { extractAnimeData } from '@/lib/utils';

interface Props {
  title:        string;
  icon:         React.ReactNode;
  items:        Record<string,unknown>[];
  loading?:     boolean;
  onDownload?:  (slug:string,title:string,cover:string) => void;
  onWatchlist?: (slug:string,title:string,cover:string) => void;
  watchedSlugs?: Set<string>;
}

export default function AnimeSection({ title, icon, items, loading, onDownload, onWatchlist, watchedSlugs }: Props) {
  return (
    <section className="px-[clamp(16px,4vw,56px)] py-7">
      <div className="flex items-center gap-3 font-display font-bold text-[clamp(.95rem,2.3vw,1.2rem)] text-s5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-s2 flex items-center justify-center border border-[var(--border)] shrink-0">
          {icon}
        </div>
        {title}
      </div>

      <div className="relative">
        <div className="snap-row">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <AnimeCardSkeleton key={i} />)
            : items.length > 0
              ? items.slice(0, 24).map((raw, i) => {
                  const a = extractAnimeData(raw);
                  return (
                    <AnimeCard
                      key={`${a.slug || 'item'}-${i}`}
                      slug={a.slug} title={a.title} cover={a.cover}
                      score={a.score} episodes={a.episodes} type={a.type}
                      delay={i * 45}
                      inWatchlist={watchedSlugs?.has(a.slug)}
                      onDownload={onDownload ? () => onDownload(a.slug, a.title, a.cover) : undefined}
                      onWatchlist={onWatchlist ? () => onWatchlist(a.slug, a.title, a.cover) : undefined}
                    />
                  );
                })
              : (
                <div className="min-h-[220px] flex items-center justify-center rounded-3xl border border-dashed border-s2 bg-s0/60 text-s4 text-sm">
                  No anime data available right now.
                </div>
              )
          }
        </div>
        {/* Right fade mask */}
        <div className="absolute top-0 right-0 bottom-0 w-16 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, var(--s0))' }} />
      </div>
    </section>
  );
}
