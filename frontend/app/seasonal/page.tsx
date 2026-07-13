'use client';
import { useEffect, useState } from 'react';
import { animeAPI } from '@/lib/api';
import { extractAnimeData } from '@/lib/utils';
import Link from 'next/link';
import { Sun, Leaf, Snowflake, CloudRain, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1); // Next year down to 4 years ago

const getSeasonIcon = (season: string) => {
  switch (season) {
    case 'WINTER': return <Snowflake size={18} />;
    case 'SPRING': return <Leaf size={18} />;
    case 'SUMMER': return <Sun size={18} />;
    case 'FALL': return <CloudRain size={18} />;
    default: return <Sun size={18} />;
  }
};

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'SPRING';
  if (month >= 5 && month <= 7) return 'SUMMER';
  if (month >= 8 && month <= 10) return 'FALL';
  return 'WINTER';
};

export default function SeasonalPage() {
  const [activeSeason, setActiveSeason] = useState(getCurrentSeason());
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());
  const [seasonalAnime, setSeasonalAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Seasonal Anime — AniVerse';
  }, []);

  useEffect(() => {
    setLoading(true);
    animeAPI.getSeasonal(activeYear, activeSeason).then(({ data }) => {
      const results = data.results || data.items || data.data || (Array.isArray(data) ? data : []);
      setSeasonalAnime(results);
    }).catch(() => {
      setSeasonalAnime([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [activeSeason, activeYear]);

  return (
    <div className="pt-24 px-[clamp(16px,5vw,64px)] pb-20 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-s5 flex items-center justify-center shadow-lg shadow-s5/20">
          <Sun className="text-white" size={20} />
        </div>
        <div>
          <h1 className="font-display font-black text-3xl text-s5 leading-tight">Seasonal Anime</h1>
          <p className="text-sm font-medium text-s4">Browse anime by season and year</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 items-center bg-s1 p-4 rounded-2xl border border-[var(--border)]">
        <div className="flex gap-2 p-1 bg-s2 rounded-xl">
          {SEASONS.map(season => (
            <button key={season} onClick={() => setActiveSeason(season)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                activeSeason === season 
                  ? 'bg-s5 text-white shadow-md shadow-s5/20' 
                  : 'text-s4 hover:text-s5 hover:bg-s3/30'
              }`}>
              {getSeasonIcon(season)}
              {season}
            </button>
          ))}
        </div>

        <select 
          value={activeYear} 
          onChange={(e) => setActiveYear(Number(e.target.value))}
          className="bg-s2 border border-[var(--border)] text-s5 font-bold text-sm px-4 py-2 rounded-xl outline-none focus:border-s5 transition-colors cursor-pointer"
        >
          {YEARS.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div key={`${activeSeason}-${activeYear}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:gap-6"
        >
          {loading ? (
            Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ aspectRatio: '2/3' }} />
            ))
          ) : seasonalAnime.length > 0 ? (
            seasonalAnime.map((r, i) => {
              const a = extractAnimeData(r);
              return (
                <Link key={a.slug || i} href={`/anime/${a.slug}?title=${encodeURIComponent(a.title)}`}
                  className="group relative block"
                >
                  <div className="w-full rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all relative mb-3"
                    style={{ aspectRatio: '2/3', boxShadow: 'var(--shadow-sm)' }}>
                    {a.cover ? (
                      <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Play size={24} className="text-s3" /></div>
                    )}
                    {a.score > 0 && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-sm flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {a.score.toFixed(1)}
                      </div>
                    )}
                    {a.type && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-s5/90 text-[9px] font-bold text-white uppercase">
                        {a.type}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <Play className="text-white drop-shadow-md" size={24} fill="currentColor" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-s5 group-hover:text-s4 transition-colors line-clamp-2 leading-tight">{a.title}</h3>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-s2 border border-[var(--border)] flex items-center justify-center mb-4">
                <Sun size={24} className="text-s3" />
              </div>
              <p className="text-s4 font-semibold">No anime found for {activeSeason} {activeYear}.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
