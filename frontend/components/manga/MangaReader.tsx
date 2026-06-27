import React, { useEffect, useRef, useState } from 'react';
import { useMangaStore } from '../../store/mangaStore';

interface MangaReaderProps {
  pages: string[];
  currentPage: number;
  onPageChange: (p: number) => void;
  onToggleToolbar: () => void;
}

export default function MangaReader({ pages, currentPage, onPageChange, onToggleToolbar }: MangaReaderProps) {
  const settings = useMangaStore(state => state.settings);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track visible page in webtoon mode
  useEffect(() => {
    if (settings.mode !== 'webtoon') return;
    
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pageElements = container.querySelectorAll('[data-page]');
      let mostVisible = 1;
      let maxArea = 0;

      pageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Calculate visible area
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visibleHeight > maxArea) {
          maxArea = visibleHeight;
          mostVisible = Number(el.getAttribute('data-page'));
        }
      });

      if (mostVisible !== currentPage) {
        onPageChange(mostVisible);
      }
    };

    // Throttled scroll
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use window or container depending on structure
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [settings.mode, currentPage, onPageChange]);

  // Click handling
  const handleClick = (e: React.MouseEvent) => {
    const width = window.innerWidth;
    const x = e.clientX;

    // Center 40% toggles toolbar
    if (x > width * 0.3 && x < width * 0.7) {
      onToggleToolbar();
      return;
    }

    if (settings.mode === 'horizontal') {
      const isRightClick = x > width * 0.5;
      
      let nextP = currentPage;
      if (settings.direction === 'ltr') {
        nextP += isRightClick ? 1 : -1;
      } else {
        // rtl
        nextP += isRightClick ? -1 : 1;
      }

      if (nextP >= 1 && nextP <= pages.length) {
        onPageChange(nextP);
      }
    }
  };

  if (settings.mode === 'webtoon') {
    return (
      <div 
        ref={containerRef}
        className="w-full min-h-screen flex flex-col items-center bg-[#0a0a0a]"
        onClick={handleClick}
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col">
          {pages.map((p, i) => (
            <img 
              key={p} 
              data-page={i + 1}
              src={p} 
              alt={`Page ${i + 1}`} 
              loading={i < 3 ? 'eager' : 'lazy'}
              className="w-full h-auto object-contain bg-s0"
              style={{ minHeight: '50vh' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Horizontal mode
  const currentUrl = pages[currentPage - 1];

  return (
    <div 
      className="fixed inset-0 z-40 bg-[#0a0a0a] flex items-center justify-center select-none"
      onClick={handleClick}
    >
      {/* Preload next image silently */}
      {currentPage < pages.length && (
        <link rel="preload" as="image" href={pages[currentPage]} />
      )}
      
      <img 
        src={currentUrl} 
        alt={`Page ${currentPage}`} 
        className="max-w-full max-h-screen object-contain"
      />
    </div>
  );
}
