import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, SortAsc, SortDesc, Eye, Clock, Download } from 'lucide-react';
import type { Chapter } from '../../lib/manga/types';
import { useMangaStore } from '../../store/mangaStore';
import { formatTime } from '../../lib/utils'; // Make sure this exists or replace

interface ChapterListProps {
  mangaId: string;
  mangaTitle: string;
  chapters: Chapter[];
}

export default function ChapterList({ mangaId, mangaTitle, chapters }: ChapterListProps) {
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [language, setLanguage] = useState('en');
  
  const progress = useMangaStore(state => state.getProgress(mangaId));

  // Extract unique languages
  const langs = useMemo(() => {
    const set = new Set(chapters.map(c => c.translatedLanguage));
    return Array.from(set).sort();
  }, [chapters]);

  // Ensure selected language exists, otherwise fallback to first
  const activeLang = langs.includes(language) ? language : (langs[0] || 'en');

  const filteredChapters = useMemo(() => {
    let list = chapters.filter(c => c.translatedLanguage === activeLang);
    
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => 
        (c.chapter && c.chapter.includes(q)) || 
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.scanlationGroup && c.scanlationGroup.toLowerCase().includes(q))
      );
    }
    
    // MangaDex usually returns them asc, so reverse if sortDesc
    list = list.sort((a, b) => {
      const numA = parseFloat(a.chapter || '0');
      const numB = parseFloat(b.chapter || '0');
      return sortDesc ? numB - numA : numA - numB;
    });

    return list;
  }, [chapters, activeLang, search, sortDesc]);

  // Virtualization is ideal here, but for simplicity and robust native scrolling,
  // we'll use CSS content-visibility and rely on fast DOM updates, or standard mapping.
  // Given MangaDex chapters can be 1000+, let's cap initial render or use a simple windowing approach if needed.
  // For now, mapping works fine if kept lightweight.

  const [displayCount, setDisplayCount] = useState(100);

  const displayed = filteredChapters.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-s1 p-3 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s4" />
          <input 
            type="text" 
            placeholder="Search chapter or group..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-s2 border border-transparent focus:border-accent rounded-lg pl-9 pr-3 py-2 text-sm text-s5 outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {langs.length > 1 && (
            <select 
              value={activeLang} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-s2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-bold text-s5 outline-none cursor-pointer uppercase"
            >
              {langs.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          
          <button 
            onClick={() => setSortDesc(!sortDesc)}
            className="p-2 bg-s2 hover:bg-s3 rounded-lg text-s5 transition-colors border border-[var(--border)]"
            title={sortDesc ? 'Sort Ascending' : 'Sort Descending'}
          >
            {sortDesc ? <SortDesc size={18} /> : <SortAsc size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-xs font-bold text-s4 uppercase tracking-widest">
        <span>{filteredChapters.length} Chapters</span>
        {progress && <span>Last read: Ch {progress.chapterNum}</span>}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {displayed.map(ch => {
          const isRead = progress && progress.chapterId === ch.id;
          const isExternal = !!ch.externalUrl;
          
          return (
            <Link 
              key={ch.id}
              href={isExternal ? ch.externalUrl! : `/manga/read/${mangaId}/${ch.id}`}
              target={isExternal ? '_blank' : '_self'}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all
                ${isRead 
                  ? 'bg-s2/30 border-[var(--border)] opacity-70 hover:opacity-100' 
                  : 'bg-s1 border-transparent hover:border-accent hover:bg-s2 shadow-sm'
                }
              `}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm md:text-base truncate ${isRead ? 'text-s4' : 'text-s5 group-hover:text-accent'}`}>
                    {ch.chapter ? `Chapter ${ch.chapter}` : 'Oneshot'}
                  </span>
                  {ch.title && (
                    <span className="text-s4 text-sm truncate">— {ch.title}</span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-s3 font-medium">
                  {ch.scanlationGroup && (
                    <span className="flex items-center gap-1"><Filter size={12}/> {ch.scanlationGroup}</span>
                  )}
                  {ch.publishAt && (
                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(ch.publishAt).toLocaleDateString()}</span>
                  )}
                  {isExternal && (
                    <span className="text-blue-400 font-bold border border-blue-400/30 px-1.5 py-0.5 rounded text-[10px] uppercase">External</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 text-s4 group-hover:text-s5 transition-colors">
                {isRead && <Eye size={18} className="text-accent" />}
              </div>
            </Link>
          );
        })}
        
        {filteredChapters.length === 0 && (
          <div className="text-center py-12 text-s4">No chapters found for this language/search.</div>
        )}

        {displayCount < filteredChapters.length && (
          <button 
            onClick={() => setDisplayCount(c => c + 100)}
            className="w-full py-4 mt-2 rounded-xl border border-dashed border-[var(--border)] text-s4 font-bold hover:text-s5 hover:bg-s1 transition-colors"
          >
            Load More Chapters
          </button>
        )}
      </div>
    </div>
  );
}
