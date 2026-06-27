'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SortAsc, SortDesc, Filter, Clock, Eye, ChevronDown } from 'lucide-react';
import type { MDXChapter } from '@/lib/manga/mangaDexClient';
import { useMangaStore } from '@/store/mangaStore';

interface ChapterListProps {
  mangaId: string;  // AniList ID as string
  mangaTitle: string;
  chapters: MDXChapter[];
  loading?: boolean;
}

function ChapterSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-xl" />
      ))}
    </div>
  );
}

export default function MangaChapterList({ mangaId, mangaTitle, chapters, loading }: ChapterListProps) {
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [displayCount, setDisplayCount] = useState(100);
  const progress = useMangaStore(s => s.getProgress(mangaId));

  const filtered = useMemo(() => {
    let list = [...chapters];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.chapter?.includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.scanlationGroup?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const na = parseFloat(a.chapter || '0');
      const nb = parseFloat(b.chapter || '0');
      return sortDesc ? nb - na : na - nb;
    });

    return list;
  }, [chapters, search, sortDesc]);

  const displayed = filtered.slice(0, displayCount);

  if (loading) return <ChapterSkeleton />;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chapters..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-100 border border-blue-200 focus:border-blue-400 text-sm text-slate-700 placeholder-slate-600 outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setSortDesc(!sortDesc)}
          className="p-2 rounded-lg bg-slate-100 border border-blue-200 text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all"
        >
          {sortDesc ? <SortDesc size={16} /> : <SortAsc size={16} />}
        </button>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-600 uppercase tracking-widest">
        <span>{filtered.length} Chapters</span>
        {progress && <span className="text-blue-500/60">Last read: Ch {progress.chapterNum}</span>}
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5">
        {displayed.map(ch => {
          const isRead = progress?.chapterId === ch.id;
          const isExternal = !!ch.externalUrl;

          return (
            <Link
              key={ch.id}
              href={isExternal ? ch.externalUrl! : `/manga/${mangaId}/reader/${ch.id}`}
              target={isExternal ? '_blank' : '_self'}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all group ${
                isRead
                  ? 'bg-blue-50 border-blue-200 opacity-60 hover:opacity-90'
                  : 'bg-slate-50 border-red-950/10 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${isRead ? 'text-slate-500' : 'text-slate-800 group-hover:text-slate-900'} transition-colors`}>
                    {ch.chapter ? `Chapter ${ch.chapter}` : 'Oneshot'}
                  </span>
                  {ch.title && (
                    <span className="text-slate-600 text-xs truncate">— {ch.title}</span>
                  )}
                  {isExternal && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">EXT</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-slate-600">
                  {ch.scanlationGroup && (
                    <span className="flex items-center gap-1"><Filter size={9} /> {ch.scanlationGroup}</span>
                  )}
                  {ch.publishAt && (
                    <span className="flex items-center gap-1"><Clock size={9} /> {new Date(ch.publishAt).toLocaleDateString()}</span>
                  )}
                  {ch.pages > 0 && <span>{ch.pages}p</span>}
                </div>
              </div>
              <div className="shrink-0">
                {isRead && <Eye size={16} className="text-blue-500" />}
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-600">
            <p className="font-bold">No chapters found</p>
          </div>
        )}

        {displayCount < filtered.length && (
          <button
            onClick={() => setDisplayCount(c => c + 100)}
            className="w-full py-3 mt-1 rounded-xl border border-dashed border-blue-200 text-slate-500 hover:text-slate-700 hover:border-blue-400 transition-all text-sm font-bold flex items-center justify-center gap-2"
          >
            <ChevronDown size={16} /> Load More ({filtered.length - displayCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
