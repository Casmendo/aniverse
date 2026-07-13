'use client';
import { useEffect, useState } from 'react';
import { animeAPI } from '@/lib/api';
import { extractAnimeData } from '@/lib/utils';
import Link from 'next/link';
import { Calendar, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function SchedulePage() {
  const [activeDay, setActiveDay] = useState(() => {
    return DAYS[new Date().getDay()];
  });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Release Schedule — AniVerse';
  }, []);

  useEffect(() => {
    setLoading(true);
    animeAPI.getSchedule(activeDay).then(({ data }) => {
      const results = data.results || data.items || data.data || (Array.isArray(data) ? data : []);
      setSchedule(results);
    }).catch(() => {
      setSchedule([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [activeDay]);

  return (
    <div className="pt-24 px-[clamp(16px,5vw,64px)] pb-20 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-s5 flex items-center justify-center shadow-lg shadow-s5/20">
          <Calendar className="text-white" size={20} />
        </div>
        <div>
          <h1 className="font-display font-black text-3xl text-s5 leading-tight">Release Schedule</h1>
          <p className="text-sm font-medium text-s4">Find out when new episodes air</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 ep-scroll">
        {DAYS.map(day => (
          <button key={day} onClick={() => setActiveDay(day)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${
              activeDay === day 
                ? 'bg-s5 text-white border-s5 shadow-md shadow-s5/20' 
                : 'bg-s1 text-s4 border-[var(--border)] hover:bg-s2 hover:text-s5'
            }`}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div key={activeDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 sm:gap-6"
        >
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ aspectRatio: '2/3' }} />
            ))
          ) : schedule.length > 0 ? (
            schedule.map((r, i) => {
              const a = extractAnimeData(r);
              // Extract airing time if available
              const airingAt = r.airingAt || r.nextAiringEpisode?.airingAt;
              const timeString = airingAt ? new Date(airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              
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
                    {timeString && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-sm">
                        {timeString}
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
                <Calendar size={24} className="text-s3" />
              </div>
              <p className="text-s4 font-semibold">No anime scheduled for {activeDay}.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
