import React from 'react';

export function MangaCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full aspect-[2/3] rounded-xl skeleton" />
      <div className="w-3/4 h-4 rounded skeleton" />
      <div className="w-1/2 h-3 rounded skeleton" />
    </div>
  );
}

export function MangaHeroSkeleton() {
  return (
    <div className="relative w-full h-[50vh] min-h-[400px] bg-s1 skeleton border-b border-[var(--border)] overflow-hidden">
       {/* Some gradient overlay to match real hero */}
       <div className="absolute inset-0 bg-gradient-to-t from-s0 via-s0/80 to-transparent" />
       
       <div className="absolute bottom-0 left-0 right-0 p-[clamp(16px,5vw,56px)] flex items-end gap-6 z-10">
          <div className="hidden md:block w-48 aspect-[2/3] rounded-xl skeleton shadow-2xl shrink-0" />
          <div className="flex-1 pb-4">
             <div className="w-24 h-6 rounded-full skeleton mb-4" />
             <div className="w-3/4 h-10 rounded skeleton mb-3" />
             <div className="w-full max-w-2xl h-20 rounded skeleton mb-6" />
             <div className="flex gap-3">
                <div className="w-32 h-12 rounded-xl skeleton" />
                <div className="w-12 h-12 rounded-xl skeleton" />
             </div>
          </div>
       </div>
    </div>
  );
}

export function ChapterListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="w-full h-16 rounded-xl skeleton" />
      ))}
    </div>
  );
}
