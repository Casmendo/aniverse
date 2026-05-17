'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Download, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, MessageSquare, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { animeAPI, commentAPI } from '@/lib/api';
import { extractAnimeData, extractEpisode } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useDownloadStore } from '@/store/downloadStore';

export default function AnimePage({ params, searchParams }: { params: { slug:string }, searchParams: { title?: string } }) {
  const { slug } = params;
  const initialTitle = searchParams.title || '';
  // Helper to detect raw UUID/session strings that are never valid anime titles
  const isUuid = (s: string) => /^[a-f0-9-]{20,}$/i.test(s) && !s.includes(' ');
  const router   = useRouter();
  const toast    = useToast();
  const { user } = useAuthStore();
  const { toggleWatchlist, isInWatchlist, trackVisit } = useWatchlistStore();
  const { add: addDownload } = useDownloadStore();

  const [anime,       setAnime]       = useState<ReturnType<typeof extractAnimeData>|null>(
    initialTitle ? { slug, title: initialTitle, cover: '', banner: '', description: '', genres: [], score: 0, episodes: 0, status: '', year: '', type: '' } as any : null
  );
  const [episodes,    setEpisodes]    = useState<ReturnType<typeof extractEpisode>[]>([]);
  const [comments,    setComments]    = useState<any[]>([]);
  const [totalCmts,   setTotalCmts]   = useState(0);
  const [cmtPage,     setCmtPage]     = useState(1);
  const [cmtText,     setCmtText]     = useState('');
  const [postingCmt,  setPostingCmt]  = useState(false);
  const [loadingAnime,setLoadingAnime]= useState(true);
  const [loadingEps,  setLoadingEps]  = useState(true);
  const [expanded,    setExpanded]    = useState(false);
  const [relatedSeries, setRelatedSeries] = useState<any[]>([]);

  const inWl = isInWatchlist(slug);

  // Track visit automatically
  useEffect(() => {
    if (anime) trackVisit(slug, anime.title, anime.cover);
  }, [anime]);

  useEffect(() => {
    (async () => {
      setLoadingAnime(true);
      try {
        const { data } = await animeAPI.getDetail(slug);
        const raw = (data && typeof data === 'object')
          ? data.data?.anime || data.data || data.anime || data
          : data;
        if (!raw || (Array.isArray(raw) && raw.length === 0)) {
          throw new Error('Anime not found');
        }
        const info = extractAnimeData(raw);
        if (initialTitle && (!info.title || info.title === 'Unknown Anime' || info.title === slug || /^[a-f0-9\-]{20,}$/.test(info.title))) {
          info.title = initialTitle;
        }
        setAnime(info);
        document.title = `${info.title} — AniVerse`;
        // Fetch related seasons/series
        animeAPI.search(info.title).then(({ data }) => {
          const items = Array.isArray(data) ? data : data.results || data.data || [];
          // Strips Season X, Part X, S X, and anything after colon or hyphen to get base name
          const cleaned = info.title.replace(/(Season \d+|Part \d+|S\d+|\d+(st|nd|rd|th) Season|:.*|-.*).*$/i, '').trim();
          animeAPI.search(cleaned).then(({ data: data2 }) => {
            const items2 = Array.isArray(data2) ? data2 : data2.results || data2.data || [];
            const merged = [...items, ...items2];
            const unique = Array.from(new Map(merged.map(item => [item.session || item.id, item])).values());
            // Filter strictly to avoid completely unrelated anime, match by checking if the cleaned title is in their title
            const related = unique.filter(i => {
              if (i.session === slug || i.id === slug) return false;
              const t = String(i.title).toLowerCase();
              return t.includes(cleaned.toLowerCase());
            });
            setRelatedSeries(related);
          }).catch(() => setRelatedSeries(items.filter(i => (i.session !== slug && i.id !== slug))));
        }).catch(() => {});
      } catch {
        try {
          const { data } = await animeAPI.getEpisodes(slug);
          const raw = data.episodes || data.data || data.results || (Array.isArray(data) ? data : []);
          const first = Array.isArray(raw) ? raw[0] : null;
          if (first) {
            // Try to find the real anime title from multiple possible fields in the episode data
            const f = first as any;
            const realTitle = initialTitle ||
              (f.anime_title && !isUuid(f.anime_title) ? f.anime_title : '') ||
              (f.anime_name  && !isUuid(f.anime_name)  ? f.anime_name  : '') ||
              (f.title       && !isUuid(f.title)       ? f.title       : '') ||
              '';
            const info = extractAnimeData(f);
            info.title = realTitle || info.title;
            if (!info.title || info.title === 'Unknown Anime') info.title = slug;
            info.slug = slug;
            setAnime(info);
            document.title = `${info.title} — AniVerse`;
          } else {
            throw new Error('Anime not found');
          }
        } catch {
          toast('Could not load anime','error');
        }
      } finally { setLoadingAnime(false); }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      setLoadingEps(true);
      try {
        const { data } = await animeAPI.getEpisodes(slug, initialTitle || anime?.title || '');
        const raw = data.episodes||data.data||data.results||(Array.isArray(data)?data:[]);
        setEpisodes(raw.map((ep:Record<string,unknown>,i:number)=>extractEpisode(ep,i)));
      } catch {}
      finally { setLoadingEps(false); }
    })();
  }, [slug]);

  useEffect(() => { loadCmts(1,false); }, [slug]);

  async function loadCmts(page:number, append:boolean) {
    try {
      const { data } = await commentAPI.get(slug, page);
      setTotalCmts(data.total||0);
      setComments(p => append ? [...p,...data.comments] : data.comments);
      setCmtPage(page);
    } catch {}
  }

  async function postComment() {
    if (!user) { toast('Sign in to comment','warn'); router.push('/auth'); return; }
    if (!cmtText.trim()) return;
    setPostingCmt(true);
    try {
      await commentAPI.post(slug, cmtText.trim());
      setCmtText(''); await loadCmts(1,false); toast('Comment posted!','success');
    } catch(e:any) { toast(e.message,'error'); }
    finally { setPostingCmt(false); }
  }

  async function deleteComment(id:number) {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentAPI.delete(id);
      setComments(p=>p.filter(c=>c.id!==id));
      setTotalCmts(p=>Math.max(0,p-1));
    } catch {}
  }

  const handleWatchlist = () => {
    if (!anime) return;
    const added = toggleWatchlist({slug,title:anime.title,cover:anime.cover});
    toast(added ? 'Added to watchlist' : 'Removed from watchlist','info');
  };

  const saveEp = async (ep: ReturnType<typeof extractEpisode>) => {
    if (!anime) return;
    const r = await addDownload({
      anime_slug:slug, anime_title:anime.title, anime_cover:anime.cover,
      episode_num:ep.num, episode_id:ep.id, episode_title:ep.title,
    }, !!user);
    if (r.duplicate) toast(`EP ${ep.num} already saved`,'info');
    else if (r.success) toast(`EP ${ep.num} saved!`,'success');
  };

  const stars = (score:number) => Array.from({length:5},(_,i)=>(
    <svg key={i} width="13" height="13" viewBox="0 0 24 24"
      fill={i<Math.round(score/2)?'#CCD0CF':'none'} stroke="#CCD0CF" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ));

  if (loadingAnime) return <DetailSkeleton />;
  const a = anime!;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}>
      {/* Backdrop */}
      <div className="relative overflow-hidden" style={{height:'clamp(200px,40vh,380px)'}}>
        <div className="absolute inset-0 bg-cover bg-center"
          style={{backgroundImage:`url('${a.banner||a.cover}')`,filter:'brightness(0.22) saturate(0.6)',transform:'scale(1.06)'}} />
        <div className="absolute inset-0" style={{background:'linear-gradient(0deg,#06141B 0%,rgba(6,20,27,.5) 60%,transparent 100%)'}} />
        <div className="absolute inset-0" style={{background:'linear-gradient(90deg,rgba(6,20,27,.7) 0%,transparent 60%)'}} />
      </div>

      {/* Main */}
      <div className="relative z-10 px-[clamp(16px,5vw,64px)] -mt-32">
        <div className="flex gap-5 items-end flex-wrap">
          {/* Poster */}
          <div className="w-[clamp(110px,16vw,190px)] shrink-0 rounded-xl overflow-hidden border border-[var(--border)]"
            style={{boxShadow:'var(--shadow-lg)',aspectRatio:'2/3'}}>
            <img src={a.cover||`https://picsum.photos/seed/${slug}/300/450`} alt={a.title}
              className="w-full h-full object-cover"
              onError={e=>{(e.target as HTMLImageElement).src=`https://picsum.photos/seed/${slug}/300/450`;}} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-[240px] pb-1">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {a.genres.slice(0,5).map(g=>(
                <span key={g} className="text-[10px] px-2.5 py-1 rounded-full bg-s1 border border-[var(--border)] text-s4 font-semibold">{g}</span>
              ))}
            </div>
            <h1 className="font-display font-black text-s5 leading-[1.1] mb-2" style={{fontSize:'clamp(1.4rem,3.5vw,2.5rem)'}}>
              {a.title}
            </h1>
            <div className="flex items-center flex-wrap gap-3 mb-4 text-xs">
              {a.score>0 && <span className="flex items-center gap-1.5 font-mono font-bold text-s5"><span className="flex gap-0.5">{stars(a.score)}</span>{a.score.toFixed(1)}</span>}
              {a.status && <span className="flex items-center gap-1.5 text-s4"><span className="w-1.5 h-1.5 rounded-full bg-s4" />{a.status}</span>}
              {a.episodes>0 && <span className="text-s4">{a.episodes} Episodes</span>}
              {a.year && <span className="text-s4">{a.year}</span>}
              {a.type && <span className="px-2 py-0.5 rounded bg-s2 text-s4 border border-[var(--border)]">{a.type}</span>}
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className={`text-sm text-s4 leading-relaxed ${!expanded?'line-clamp-3':''}`}>{a.description}</p>
              {a.description.length>200 && (
                <button onClick={()=>setExpanded(!expanded)}
                  className="flex items-center gap-1 text-s5 text-xs font-semibold mt-1.5 hover:text-s4 transition-colors">
                  {expanded ? <><ChevronUp size={13}/>Show less</> : <><ChevronDown size={13}/>Read more</>}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 flex-wrap">
              <Link href={episodes.length?`/watch/${slug}/${episodes[0].id}?title=${encodeURIComponent(a.title)}&ep=${episodes[0].num}`:'#'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-s5 text-s0 hover:bg-s4 hover:-translate-y-0.5 transition-all"
                style={{boxShadow:'var(--shadow)'}}>
                <Play size={16} fill="currentColor" />Watch Now
              </Link>
              <button onClick={()=>episodes[0]&&saveEp(episodes[0])}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm text-s5 bg-s1 border border-[var(--border)] hover:bg-s2 hover:-translate-y-0.5 transition-all">
                <Download size={15}/>Save EP 1
              </button>
              <button onClick={handleWatchlist}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm border transition-all hover:-translate-y-0.5 ${
                  inWl ? 'bg-s2 border-[var(--border-hi)] text-s5' : 'text-s4 border-[var(--border)] bg-s1 hover:bg-s2'
                }`}>
                {inWl ? <BookmarkCheck size={15}/> : <Bookmark size={15}/>}
                {inWl ? 'In Watchlist' : 'Watchlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Related Seasons / Series */}
        {relatedSeries.length > 0 && (
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <h3 className="font-display font-bold text-lg text-s5 mb-4">Related Seasons</h3>
            <div className="flex flex-wrap gap-2">
              {relatedSeries.slice(0, 10).map((rel) => (
                <Link key={rel.session || rel.id} href={`/anime/${rel.session || rel.id}?title=${encodeURIComponent(rel.title)}`}
                  className="px-4 py-2 rounded-xl bg-s2 border border-[var(--border)] text-xs font-bold text-s4 hover:text-s5 hover:border-s3 transition-all"
                >
                  {rel.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Episodes */}
        <div className="mt-10">
          <h2 className="flex items-center gap-2.5 font-display font-bold text-lg text-s5 mb-4">
            <span className="w-6 h-6 rounded-lg bg-s2 border border-[var(--border)] flex items-center justify-center">
              <Play size={12} fill="currentColor" className="text-s4 ml-0.5" />
            </span>
            Episodes
            {episodes.length>0 && <span className="text-s3 text-sm font-normal">({episodes.length})</span>}
          </h2>

          {loadingEps ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({length:8},(_,i)=>(
                <div key={i} className="bg-s1 rounded-xl p-3 space-y-2 border border-[var(--border)]">
                  <div className="skeleton w-full rounded aspect-video" />
                  <div className="skeleton h-3 w-2/5 rounded" />
                  <div className="skeleton h-4 w-4/5 rounded" />
                </div>
              ))}
            </div>
          ) : episodes.length===0 ? (
            <p className="text-s3 text-sm py-6">No episodes found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {episodes.map(ep => (
                <motion.div key={ep.id} whileHover={{y:-3}} transition={{duration:0.2}}
                  className="bg-s1 border border-[var(--border)] rounded-xl overflow-hidden cursor-pointer group"
                  style={{boxShadow:'var(--shadow-sm)'}}
                  onClick={()=>router.push(`/watch/${slug}/${ep.id}?title=${encodeURIComponent(a.title)}&ep=${ep.num}`)}>
                  {ep.thumbnail ? (
                    <img src={ep.thumbnail} alt={ep.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-400" style={{aspectRatio:'16/9'}}
                      onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
                  ) : (
                    <div className="w-full bg-s2 flex items-center justify-center" style={{aspectRatio:'16/9'}}>
                      <Play size={20} className="text-s3 opacity-40" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="text-[10px] font-mono text-s4 font-bold mb-0.5">EP {ep.num}</div>
                    <div className="text-xs font-semibold leading-tight line-clamp-2 text-s5">{ep.title}</div>
                    <button onClick={e=>{e.stopPropagation();saveEp(ep);}}
                      className="mt-1.5 flex items-center gap-1 text-[10px] text-s3 hover:text-s5 transition-colors">
                      <Download size={10}/>Save
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="mt-12 pb-8">
          <h2 className="flex items-center gap-2.5 font-display font-bold text-lg text-s5 mb-6">
            <span className="w-6 h-6 rounded-lg bg-s2 border border-[var(--border)] flex items-center justify-center">
              <MessageSquare size={12} className="text-s4" />
            </span>
            Community
            {totalCmts>0 && <span className="text-s3 text-sm font-normal">({totalCmts})</span>}
          </h2>

          {user ? (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-s2 border border-[var(--border)] flex items-center justify-center font-bold text-sm shrink-0 text-s5">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input value={cmtText} onChange={e=>setCmtText(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();postComment();}}}
                  maxLength={1000} placeholder="Share your thoughts…"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-s1 border border-[var(--border)] text-sm text-s5 outline-none focus:border-[var(--border-hi)] transition-colors placeholder:text-s3" />
                <button onClick={postComment} disabled={postingCmt||!cmtText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-s2 border border-[var(--border)] text-s4 hover:bg-s2/70 hover:text-s5 text-sm disabled:opacity-40 transition-all flex items-center gap-2">
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-s3 mb-6">
              <Link href="/auth" className="text-s5 font-semibold hover:underline">Sign in</Link> to join the discussion.
            </p>
          )}

          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-s2 border border-[var(--border)] flex items-center justify-center font-bold text-xs shrink-0 text-s5">
                  {c.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-s5">{c.username}</span>
                    <span className="text-[10px] text-s3">{c.time}</span>
                    {user?.username===c.username && (
                      <button onClick={()=>deleteComment(c.id)} className="ml-auto text-s3 hover:text-red-400 transition-colors">
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-s4 mt-1 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length===0 && <p className="text-s3 text-sm">Be the first to comment!</p>}
          </div>
          {comments.length<totalCmts && (
            <button onClick={()=>loadCmts(cmtPage+1,true)}
              className="mt-5 w-full py-3 bg-s1 border border-[var(--border)] rounded-xl text-sm font-semibold text-s4 hover:bg-s2 hover:text-s5 transition-all">
              Load more comments
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{height:'clamp(200px,40vh,380px)'}} />
      <div className="px-[clamp(16px,5vw,64px)] -mt-32 space-y-4">
        <div className="flex gap-5 items-end">
          <div className="skeleton rounded-xl shrink-0" style={{width:'clamp(110px,16vw,190px)',aspectRatio:'2/3'}} />
          <div className="flex-1 space-y-3 pb-2">
            <div className="skeleton h-4 w-48 rounded-full" />
            <div className="skeleton h-10 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-full rounded mt-3" />
            <div className="skeleton h-4 w-5/6 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
