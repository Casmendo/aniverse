'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getProvider } from '@/lib/manga/providers';
import { buildPageUrl } from '@/lib/manga/providers/mangadex';
import type { MangaDetail, Chapter, ChapterPages } from '@/lib/manga/types';
import MangaReader from '@/components/manga/MangaReader';
import ReaderToolbar from '@/components/manga/ReaderToolbar';
import { useMangaStore } from '@/store/mangaStore';
import { Loader2 } from 'lucide-react';

export default function ReaderPage({ params }: { params: { slug: string; chapter: string } }) {
  const router = useRouter();
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChap, setCurrentChap] = useState<Chapter | null>(null);
  const [pagesData, setPagesData] = useState<ChapterPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { progress, updateProgress, settings } = useMangaStore();
  const currentProgress = progress[params.slug];
  
  // Start page from saved progress or 1
  const [currentPage, setCurrentPage] = useState(1);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const provider = getProvider('mangadex');
        const [mangaData, chapData] = await Promise.all([
          provider.getDetail(params.slug),
          provider.getChapters(params.slug, { limit: 500, sortOrder: 'asc' })
        ]);
        
        setManga(mangaData);
        setChapters(chapData);
        
        const c = chapData.find(x => x.id === params.chapter);
        if (c) setCurrentChap(c);

      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [params.slug, params.chapter]);

  // Load pages when chapter changes
  useEffect(() => {
    if (!currentChap) return;
    const loadPages = async () => {
      setLoading(true);
      try {
        const provider = getProvider('mangadex');
        const pData = await provider.getPages(currentChap.id, settings.dataSaver);
        setPagesData(pData);
        
        // Restore progress if returning to this chapter
        if (currentProgress?.chapterId === currentChap.id) {
          setCurrentPage(currentProgress.page);
        } else {
          setCurrentPage(1);
          window.scrollTo(0,0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, [currentChap, settings.dataSaver]); // re-fetch if dataSaver toggled

  // Sync progress
  useEffect(() => {
    if (!manga || !currentChap || !pagesData) return;
    
    updateProgress(manga.id, {
      mangaTitle: manga.title,
      coverArt: manga.coverArt,
      chapterId: currentChap.id,
      chapterNum: currentChap.chapter || '0',
      page: currentPage,
      totalPages: pagesData.data.length,
    });
  }, [currentPage, manga, currentChap, pagesData, updateProgress]);

  // Next / Prev logic
  const activeLang = currentChap?.translatedLanguage || 'en';
  const filteredChaps = useMemo(() => chapters.filter(c => c.translatedLanguage === activeLang), [chapters, activeLang]);
  
  const currentIndex = filteredChaps.findIndex(c => c.id === currentChap?.id);
  const nextChapter = currentIndex >= 0 && currentIndex < filteredChaps.length - 1 ? filteredChaps[currentIndex + 1] : null;
  const prevChapter = currentIndex > 0 ? filteredChaps[currentIndex - 1] : null;

  const goNext = () => nextChapter && router.replace(`/manga/read/${manga?.id}/${nextChapter.id}`);
  const goPrev = () => prevChapter && router.replace(`/manga/read/${manga?.id}/${prevChapter.id}`);

  // Build full URLs
  const pageUrls = useMemo(() => {
    if (!pagesData) return [];
    const source = settings.dataSaver ? pagesData.dataSaver : pagesData.data;
    return source.map(fileName => buildPageUrl(pagesData.baseUrl, pagesData.hash, fileName, settings.dataSaver));
  }, [pagesData, settings.dataSaver]);

  // Handle system back
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else setShowToolbar(t => !t);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [settingsOpen]);

  if (!manga || !currentChap || !pagesData || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ReaderToolbar 
        show={showToolbar}
        onToggle={() => setShowToolbar(!showToolbar)}
        title={manga.title}
        chapterNum={currentChap.chapter || 'Oneshot'}
        currentPage={currentPage}
        totalPages={pageUrls.length}
        onPageChange={setCurrentPage}
        onNextChapter={goNext}
        onPrevChapter={goPrev}
        hasNext={!!nextChapter}
        hasPrev={!!prevChapter}
        onBack={() => router.push(`/manga/${manga.id}`)}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      />

      <MangaReader 
        pages={pageUrls}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onToggleToolbar={() => {
          if (settingsOpen) setSettingsOpen(false);
          setShowToolbar(!showToolbar);
        }}
      />
    </div>
  );
}
