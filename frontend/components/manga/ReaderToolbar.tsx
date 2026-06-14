import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Settings, List, ChevronLeft, ChevronRight, SkipForward, SkipBack } from 'lucide-react';
import { useMangaStore } from '../../store/mangaStore';

interface ReaderToolbarProps {
  show: boolean;
  onToggle: () => void;
  title: string;
  chapterNum: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  onBack: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

export default function ReaderToolbar({
  show, onToggle, title, chapterNum, currentPage, totalPages,
  onPageChange, onNextChapter, onPrevChapter, onBack,
  hasNext, hasPrev, settingsOpen, setSettingsOpen
}: ReaderToolbarProps) {
  
  const settings = useMangaStore(state => state.settings);
  const updateSettings = useMangaStore(state => state.updateSettings);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Top Bar */}
          <motion.div 
            initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'tween', duration: 0.2 }}
            className="absolute top-0 left-0 right-0 h-16 bg-s0/90 backdrop-blur-md border-b border-[var(--border)] px-4 flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onBack} className="p-2 hover:bg-s2 rounded-full transition-colors text-s5"><ChevronLeft size={24} /></button>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-accent uppercase tracking-widest truncate">{title}</span>
                <span className="text-sm font-bold text-s5 truncate">Chapter {chapterNum}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className={`p-2 rounded-full transition-colors ${settingsOpen ? 'bg-accent text-white' : 'hover:bg-s2 text-s5'}`}>
                <Settings size={20} />
              </button>
            </div>
          </motion.div>

          {/* Settings Menu */}
          <AnimatePresence>
            {settingsOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-20 right-4 w-72 bg-s1 border border-[var(--border)] rounded-2xl shadow-2xl p-4 pointer-events-auto flex flex-col gap-5 origin-top-right"
              >
                <div>
                  <span className="text-[10px] font-bold text-s4 uppercase tracking-widest mb-2 block">Reading Mode</span>
                  <div className="flex bg-s2 rounded-lg p-1">
                    {(['webtoon', 'horizontal'] as const).map(m => (
                      <button key={m} onClick={() => updateSettings({ mode: m })} className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${settings.mode === m ? 'bg-s5 text-s0 shadow-sm' : 'text-s4 hover:text-s5'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {settings.mode === 'horizontal' && (
                  <div>
                    <span className="text-[10px] font-bold text-s4 uppercase tracking-widest mb-2 block">Direction</span>
                    <div className="flex bg-s2 rounded-lg p-1">
                      {(['ltr', 'rtl'] as const).map(d => (
                        <button key={d} onClick={() => updateSettings({ direction: d })} className={`flex-1 py-1.5 text-xs font-bold rounded-md uppercase transition-colors ${settings.direction === d ? 'bg-s5 text-s0 shadow-sm' : 'text-s4 hover:text-s5'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-s4 uppercase tracking-widest mb-2 block">Data Saver</span>
                  <button onClick={() => updateSettings({ dataSaver: !settings.dataSaver })} className={`w-full py-2 text-xs font-bold rounded-lg transition-colors border ${settings.dataSaver ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-s2 border-transparent text-s5 hover:bg-s3'}`}>
                    {settings.dataSaver ? 'Enabled (Lower Quality)' : 'Disabled (High Quality)'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Bar */}
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 h-20 bg-s0/90 backdrop-blur-md border-t border-[var(--border)] px-4 flex flex-col justify-center pointer-events-auto"
          >
            {/* Scrubber (only useful in horizontal mode, but we show it anyway) */}
            <div className="w-full max-w-2xl mx-auto flex items-center gap-4 mb-2">
              <span className="text-xs font-mono font-bold text-s4 w-8 text-right">{currentPage}</span>
              <input 
                type="range" min={1} max={totalPages} value={currentPage} 
                onChange={e => onPageChange(Number(e.target.value))}
                className="flex-1"
                style={{ direction: settings.direction === 'rtl' && settings.mode === 'horizontal' ? 'rtl' : 'ltr' }}
              />
              <span className="text-xs font-mono font-bold text-s4 w-8">{totalPages}</span>
            </div>

            <div className="w-full max-w-sm mx-auto flex items-center justify-between">
              <button disabled={!hasPrev} onClick={onPrevChapter} className="p-2 text-s5 disabled:opacity-30 disabled:cursor-not-allowed hover:text-accent transition-colors">
                <SkipBack size={20} />
              </button>
              <span className="text-xs font-bold text-s4 uppercase tracking-widest">Controls</span>
              <button disabled={!hasNext} onClick={onNextChapter} className="p-2 text-s5 disabled:opacity-30 disabled:cursor-not-allowed hover:text-accent transition-colors">
                <SkipForward size={20} />
              </button>
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
