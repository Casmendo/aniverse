'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download, Trash2, Play, FolderOpen, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useDownloadStore } from '@/store/downloadStore';
import { useAuthStore }    from '@/store/authStore';
import { useToast }        from '@/components/Toast';
import { animeAPI }        from '@/lib/api';
import { extractEpisode }  from '@/lib/utils';

export default function DownloadsPage() {
  const { user }  = useAuthStore();
  const toast     = useToast();
  const { groups, fetch, remove, removeAnime } = useDownloadStore();

  useEffect(() => { fetch(!!user); }, [user, fetch]);

  const total = groups.reduce((s,g)=>s+g.episodes.length, 0);

  return (
    <div className="px-[clamp(16px,5vw,56px)] py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-s2 border border-[var(--border)] flex items-center justify-center">
          <Download size={18} className="text-s4" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-s5">Downloads</h1>
          <p className="text-xs text-s3 mt-0.5">
            {total} episode{total!==1?'s':''} saved
            {!user && ' · Sign in to sync across devices'}
          </p>
        </div>
      </div>

      {/* Empty */}
      {groups.length===0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <FolderOpen size={56} className="text-s3" />
          <h2 className="font-display font-bold text-lg text-s4">No downloads yet</h2>
          <p className="text-sm text-s3 max-w-xs">Episodes you save will appear here, grouped by anime.</p>
          <Link href="/" className="px-6 py-3 rounded-full bg-s2 text-s5 text-sm font-bold hover:bg-s2/70 transition-all"
            style={{boxShadow:'var(--shadow-sm)'}}>
            Browse Anime
          </Link>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group, gi) => (
          <DownloadGroupCard key={group.anime_slug} group={group} gi={gi} />
        ))}
      </div>
    </div>
  );
}

function DownloadGroupCard({ group, gi }: { group: any, gi: number }) {
  const { user } = useAuthStore();
  const toast = useToast();
  const { remove, removeAnime } = useDownloadStore();
  const [showMore, setShowMore] = useState(false);
  const [loadingEps, setLoadingEps] = useState(false);
  const [remainingEps, setRemainingEps] = useState<any[]>([]);

  const loadRemaining = async () => {
    if (showMore) {
      setShowMore(false);
      return;
    }
    setShowMore(true);
    if (remainingEps.length > 0) return;
    
    setLoadingEps(true);
    try {
      const res = await animeAPI.getEpisodes(group.anime_slug, group.anime_title);
      const raw = Array.isArray(res.data) ? res.data : (res.data.results || res.data.episodes || res.data.data || []);
      const allEps = raw.map((ep: any, i: number) => extractEpisode(ep, i));
      const downloadedIds = new Set(group.episodes.map((e: any) => e.episode_id || String(e.episode_num)));
      const remaining = allEps.filter((e: any) => !downloadedIds.has(e.id) && !downloadedIds.has(String(e.num)));
      setRemainingEps(remaining);
    } catch {
      toast('Failed to load remaining episodes', 'error');
    } finally {
      setLoadingEps(false);
    }
  };

  return (
    <motion.div
      initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
      transition={{delay:gi*0.06,ease:[0.16,1,0.3,1],duration:0.45}}
      className="bg-s1 border border-[var(--border)] rounded-2xl overflow-hidden"
      style={{boxShadow:'var(--shadow-sm)'}}>

      {/* Group header */}
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <div className="w-11 h-[60px] rounded-lg overflow-hidden bg-s2 shrink-0">
          <img src={group.anime_cover} alt={group.anime_title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/anime/${group.anime_slug}?title=${encodeURIComponent(group.anime_title||'')}`}
            className="font-display font-bold text-sm text-s5 hover:text-s4 transition-colors truncate block">
            {group.anime_title||group.anime_slug}
          </Link>
          <p className="text-xs text-s3 mt-0.5">
            {group.episodes.length} episode{group.episodes.length!==1?'s':''}
          </p>
        </div>
        <button
          onClick={()=>{removeAnime(group.anime_slug,!!user);toast('Removed','info');}}
          className="p-2 rounded-lg text-s3 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Remove all">
          <Trash2 size={15}/>
        </button>
      </div>

      {/* Downloaded Episodes */}
      <div>
        {group.episodes.map((ep: any) => (
          <div key={ep.episode_num}
            className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(74,92,106,0.12)] hover:bg-s2/30 transition-colors last:border-none">
            <span className="font-mono text-[10px] text-s4 font-bold w-7 shrink-0">
              {String(ep.episode_num).padStart(2,'0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-s5 truncate">
                {ep.episode_title||`Episode ${ep.episode_num}`}
              </p>
              {ep.saved_at && <p className="text-[10px] text-s3 mt-0.5 flex items-center gap-1"><Download size={10}/> Saved {ep.saved_at}</p>}
            </div>
            <Link href={`/watch/${group.anime_slug}/${ep.episode_id}?title=${encodeURIComponent(group.anime_title||'')}&ep=${ep.episode_num}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-s5 border border-[var(--border)] text-xs font-bold text-s0 hover:bg-s4 transition-all shrink-0">
              <Play size={10} fill="currentColor"/>Play Offline
            </Link>
            <button
              onClick={()=>{remove(group.anime_slug,ep.id,!!user);toast('Episode removed','info');}}
              className="p-1.5 rounded-lg text-s3 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
              <Trash2 size={13}/>
            </button>
          </div>
        ))}
      </div>

      {/* Remaining Episodes Section */}
      <div className="border-t border-[var(--border)] bg-s0/50">
        <button onClick={loadRemaining} className="w-full py-3 px-4 flex items-center justify-between text-xs font-bold text-s4 hover:text-s5 transition-colors">
          <span>{showMore ? 'HIDE REMAINING EPISODES' : 'SHOW REMAINING EPISODES'}</span>
          {showMore ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>
        
        {showMore && (
          <div className="pb-2">
            {loadingEps ? (
              <div className="p-4 text-center text-xs text-s3">Loading episodes...</div>
            ) : remainingEps.length === 0 ? (
              <div className="p-4 text-center text-xs text-s3">No more episodes available.</div>
            ) : (
              remainingEps.slice(0, 10).map((ep) => (
                <div key={ep.id} className="flex items-center gap-3 px-4 py-2 hover:bg-s2/30 transition-colors">
                  <span className="font-mono text-[10px] text-s3 w-7 shrink-0">
                    {String(ep.num).padStart(2,'0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-s4 truncate">{ep.title}</p>
                  </div>
                  <Link href={`/watch/${group.anime_slug}/${ep.id}?title=${encodeURIComponent(group.anime_title||'')}&ep=${ep.num}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-s2 text-[10px] font-bold text-s4 hover:text-s5 hover:bg-s2/80 transition-all">
                    <Play size={10}/>Watch
                  </Link>
                </div>
              ))
            )}
            {!loadingEps && remainingEps.length > 10 && (
              <div className="px-4 py-2 text-center text-[10px] text-s3 font-semibold">
                And {remainingEps.length - 10} more episodes...
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
