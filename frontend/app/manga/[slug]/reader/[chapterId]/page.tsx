'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, X, List, Settings,
  ZoomIn, ZoomOut, Maximize, Minimize, BookOpen,
  Monitor, AlignJustify, Rows, Loader2
} from 'lucide-react';
import { unifiedMangaService } from '@/lib/manga/unifiedService';
import { mangaDexClient } from '@/lib/manga/mangaDexClient';
import { useMangaStore } from '@/store/mangaStore';

type ReadingMode = 'vertical' | 'horizontal' | 'webtoon';

// ── Page Image ────────────────────────────────────────────────────────────────
function PageImage({ url, index, mode, zoom }: { url: string; index: number; mode: ReadingMode; zoom: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center bg-slate-50"
      style={{
        width: mode === 'horizontal' ? '100%' : undefined,
        height: mode === 'webtoon' ? 'auto' : mode === 'horizontal' ? '100%' : undefined,
      }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={28} className="text-blue-500 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center p-8 text-slate-600 min-h-[200px]">
          <BookOpen size={32} className="mb-2 opacity-40" />
          <p className="text-xs">Failed to load page {index + 1}</p>
        </div>
      ) : (
        <img
          src={url}
          alt={`Page ${index + 1}`}
          loading={index < 3 ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          className="max-w-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s',
            maxHeight: mode === 'horizontal' ? '100vh' : undefined,
            objectFit: 'contain',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
        />
      )}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
interface ToolbarProps {
  visible: boolean;
  title: string;
  chapterNum: string;
  page: number;
  totalPages: number;
  mode: ReadingMode;
  zoom: number;
  isFullscreen: boolean;
  dataSaver: boolean;
  onBack: () => void;
  onModeChange: (m: ReadingMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
  onDataSaver: () => void;
  onPageChange: (n: number) => void;
}

function ReaderToolbar(props: ToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <>
      {/* Top Bar */}
      <AnimatePresence>
        {props.visible && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm"
          >
            <button onClick={props.onBack} className="w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-slate-900 hover:bg-white/95">
              <X size={18} />
            </button>
            <div className="text-center">
              <p className="text-slate-900 font-bold text-sm line-clamp-1">{props.title}</p>
              <p className="text-slate-600 text-xs">Chapter {props.chapterNum}</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-slate-900 hover:bg-white/95"
            >
              <Settings size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-4 z-50 w-64 bg-white/95 backdrop-blur-xl border border-blue-300 rounded-2xl shadow-2xl p-4 space-y-4"
          >
            {/* Reading Mode */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reading Mode</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([['vertical', Monitor, 'Vertical'], ['webtoon', Rows, 'Webtoon'], ['horizontal', AlignJustify, 'Horizontal']] as const).map(([m, Icon, label]) => (
                  <button key={m} onClick={() => props.onModeChange(m as ReadingMode)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold border transition-all ${
                      props.mode === m ? 'bg-blue-600 border-blue-600 text-slate-900' : 'border-blue-200 text-slate-500 hover:border-blue-400 hover:text-slate-700'
                    }`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Zoom */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Zoom ({Math.round(props.zoom * 100)}%)</p>
              <div className="flex items-center gap-2">
                <button onClick={props.onZoomOut} className="p-2 rounded-lg border border-blue-200 text-slate-600 hover:text-blue-600 transition-colors"><ZoomOut size={16} /></button>
                <div className="flex-1 h-1 bg-red-950/40 rounded-full relative">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${((props.zoom - 0.5) / 1.5) * 100}%` }} />
                </div>
                <button onClick={props.onZoomIn} className="p-2 rounded-lg border border-blue-200 text-slate-600 hover:text-blue-600 transition-colors"><ZoomIn size={16} /></button>
              </div>
            </div>
            {/* Data Saver */}
            <button onClick={props.onDataSaver}
              className={`w-full py-2 rounded-lg text-xs font-bold border transition-all ${
                props.dataSaver ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-blue-200 text-slate-500'
              }`}>
              {props.dataSaver ? '✓ Data Saver ON' : 'Data Saver OFF'}
            </button>
            {/* Fullscreen */}
            <button onClick={props.onFullscreen}
              className="w-full py-2 rounded-lg text-xs font-bold border border-blue-200 text-slate-500 flex items-center justify-center gap-2">
              {props.isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              {props.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar — unified, centered */}
      <AnimatePresence>
        {props.visible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-6 pt-2 px-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 70%, transparent)' }}
          >
            {/* Progress scrubber */}
            {props.totalPages > 1 && (
              <div className="w-full max-w-md flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono text-blue-600/70 tabular-nums w-5 text-right">{props.page + 1}</span>
                <div className="relative flex-1 h-1.5 group">
                  <div className="absolute inset-0 rounded-full bg-white/10" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_8px_rgba(220,38,38,0.6)]"
                    style={{ width: `${((props.page) / Math.max(props.totalPages - 1, 1)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={props.totalPages - 1}
                    value={props.page}
                    onChange={e => props.onPageChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 tabular-nums w-5">{props.totalPages}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Reader Page ───────────────────────────────────────────────────────────────

export default function ReaderPage() {
  const router = useRouter();
  const params = useParams<{ slug: string; chapterId: string }>();
  const anilistId = params.slug;
  const chapterId = params.chapterId;

  const [pages, setPages] = useState<string[]>([]);
  const [allChapters, setAllChapters] = useState<{ id: string; chapter: string | null; title: string | null; externalUrl?: string | null }[]>([]);
  const [mangaTitle, setMangaTitle] = useState('');
  const [currentChapterNum, setCurrentChapterNum] = useState('');
  const [loadingPages, setLoadingPages] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<ReadingMode>('vertical');
  const [zoom, setZoom] = useState(1);
  const [dataSaver, setDataSaver] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveProgress = useMangaStore(s => s.saveProgress);

  // Persist reader settings
  const readerSettings = useMangaStore(s => s.readerSettings);
  useEffect(() => {
    if (readerSettings) {
      setMode(readerSettings.mode as ReadingMode || 'vertical');
      setDataSaver(readerSettings.dataSaver || false);
    }
  }, []);

  // Load manga + chapters + pages
  useEffect(() => {
    async function init() {
      setLoadingPages(true);
      try {
        // Get manga detail (for MangaDex ID + title)
        const manga = await unifiedMangaService.getDetail(parseInt(anilistId, 10));
        setMangaTitle(manga.title);

        if (manga.mangaDexId) {
          const chaps = await unifiedMangaService.getChapters(manga);
          setAllChapters(chaps.map(c => ({ id: c.id, chapter: c.chapter, title: c.title, externalUrl: c.externalUrl })));
          const thisChap = chaps.find(c => c.id === chapterId);
          if (thisChap) setCurrentChapterNum(thisChap.chapter || 'Oneshot');
        }

        const urls = await unifiedMangaService.getPages(chapterId, dataSaver);
        setPages(urls);
      } catch (err) {
        console.error('Reader load error:', err);
      } finally {
        setLoadingPages(false);
      }
    }
    init();
  }, [anilistId, chapterId, dataSaver]);

  // Save reading progress
  useEffect(() => {
    if (!pages.length || !mangaTitle) return;
    saveProgress({
      mangaId: anilistId,
      mangaTitle,
      coverArt: '',
      chapterId,
      chapterNum: currentChapterNum,
      page: currentPage,
      totalPages: pages.length,
      lastRead: new Date().toISOString(),
    });
  }, [currentPage, pages.length, mangaTitle]);

  // Auto-hide UI after 3s of inactivity
  const showAndResetTimer = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => {
    showAndResetTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setCurrentPage(p => Math.min(p + 1, pages.length - 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setCurrentPage(p => Math.max(p - 1, 0));
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pages.length]);

  // Navigation helpers
  const chapterIndex = allChapters.findIndex(c => c.id === chapterId);
  const prevChapter = allChapters[chapterIndex - 1];
  const nextChapter = allChapters[chapterIndex + 1];

  const goToChapter = (chap: { id: string; externalUrl?: string | null }) => {
    if (chap.externalUrl) {
      window.open(chap.externalUrl, '_blank');
    } else {
      router.push(`/manga/${anilistId}/reader/${chap.id}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Track current page in vertical/webtoon mode via scroll
  useEffect(() => {
    if (mode !== 'vertical' && mode !== 'webtoon') return;
    const el = containerRef.current;
    if (!el) return;
    const imgs = el.querySelectorAll('img');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(imgs).indexOf(entry.target as HTMLImageElement);
          if (idx >= 0) setCurrentPage(idx);
        }
      });
    }, { threshold: 0.5 });
    imgs.forEach(img => obs.observe(img));
    return () => obs.disconnect();
  }, [pages, mode]);

  if (loadingPages) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-[9999]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)]">
          <BookOpen size={32} className="text-slate-900 animate-pulse" />
        </div>
        <p className="text-slate-600 text-sm font-bold animate-pulse">Loading chapter…</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-[9999] overflow-hidden"
      onClick={showAndResetTimer}
    >
      {pages.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-40 bg-white">
          <BookOpen size={48} className="text-blue-800 mb-4 opacity-50" />
          <h2 className="text-xl font-black text-slate-900 mb-2">No Pages Found</h2>
          <p className="text-slate-600 text-sm mb-6 max-w-sm">
            This chapter might be hosted externally (like MangaPlus) or has no pages available on MangaDex.
          </p>
          <div className="flex gap-4">
            <button onClick={() => router.push(`/manga/${anilistId}`)} className="px-6 py-2.5 rounded-full bg-blue-100 border border-blue-300 text-sm font-bold text-blue-700">
              Go Back
            </button>
            {allChapters.find(c => c.id === chapterId)?.externalUrl && (
              <a href={allChapters.find(c => c.id === chapterId)!.externalUrl!} target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-bold shadow-[0_0_24px_rgba(37,99,235,0.4)]">
                Read Externally
              </a>
            )}
          </div>
        </div>
      )}

      <ReaderToolbar
        visible={showUI}
        title={mangaTitle}
        chapterNum={currentChapterNum}
        page={currentPage}
        totalPages={pages.length}
        mode={mode}
        zoom={zoom}
        isFullscreen={isFullscreen}
        dataSaver={dataSaver}
        onBack={() => router.push(`/manga/${anilistId}`)}
        onModeChange={m => { setMode(m); useMangaStore.getState().saveReaderSettings({ mode: m, dataSaver }); }}
        onZoomIn={() => setZoom(z => Math.min(z + 0.1, 2))}
        onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))}
        onFullscreen={toggleFullscreen}
        onDataSaver={() => { setDataSaver(!dataSaver); useMangaStore.getState().saveReaderSettings({ mode, dataSaver: !dataSaver }); }}
        onPageChange={setCurrentPage}
      />

      {/* Main Content */}
      {mode === 'horizontal' ? (
        // ── Horizontal Mode ──
        <div className="relative w-full h-full flex items-center justify-center"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width * 0.33) setCurrentPage(p => Math.max(p - 1, 0));
            else if (x > rect.width * 0.67) setCurrentPage(p => Math.min(p + 1, pages.length - 1));
            else showAndResetTimer();
          }}
        >
          <AnimatePresence mode="wait">
            {pages[currentPage] && (
              <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center">
                <PageImage url={pages[currentPage]} index={currentPage} mode={mode} zoom={zoom} />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Side tap hints */}
          {showUI && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4 pointer-events-none">
                {currentPage > 0 && <ChevronLeft size={40} className="text-slate-900/20" />}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4 pointer-events-none">
                {currentPage < pages.length - 1 && <ChevronRight size={40} className="text-slate-900/20" />}
              </div>
            </>
          )}
        </div>
      ) : (
        // ── Vertical / Webtoon Mode ──
        <div
          ref={containerRef}
          className="h-full overflow-y-auto flex flex-col items-center"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="w-full max-w-3xl" style={{ paddingTop: 56, paddingBottom: 80 }}>
            {pages.map((url, i) => (
              <PageImage key={i} url={url} index={i} mode={mode} zoom={zoom} />
            ))}
          </div>
        </div>
      )}

      {/* Chapter Navigation — premium centered bar */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed bottom-8 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {/* Prev Chapter */}
              <button
                onClick={() => prevChapter && goToChapter(prevChapter)}
                disabled={!prevChapter}
                title="Previous Chapter"
                className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
              >
                <ChevronLeft size={22} className="text-slate-800" />
              </button>

              {/* Progress line */}
              <div className="flex flex-col items-center gap-1.5 min-w-[120px] sm:min-w-[180px]">
                <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{ width: pages.length > 0 ? `${((currentPage + 1) / pages.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-white/70 font-bold text-[11px] tabular-nums">
                  {currentPage + 1} / {pages.length}
                </span>
              </div>

              {/* Next Chapter */}
              <button
                onClick={() => nextChapter && goToChapter(nextChapter)}
                disabled={!nextChapter}
                title="Next Chapter"
                className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
              >
                <ChevronRight size={22} className="text-slate-800" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
