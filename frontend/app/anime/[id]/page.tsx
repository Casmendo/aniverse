'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Download, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, MessageSquare, Send, Trash2, X, Check, Tv, Layers, Clock, BookOpen, Calendar, Building2, Tags, Flag, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { animeAPI, commentAPI } from '@/lib/api';
const ADMIN_EMAIL = 'isahmusa9921@gmail.com';
import { extractAnimeData, extractEpisode } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useDownloadStore } from '@/store/downloadStore';

import { downloadAPI } from '@/lib/api';
import { processDownload } from '@/lib/downloadService';

export default function AnimePage({ params, searchParams }: { params: { id:string }, searchParams: { title?: string } }) {
  const { id: slug } = params;
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
  const [replyingToId,setReplyingToId]= useState<number | null>(null);
  const [replyText,   setReplyText]   = useState('');
  const [postingReply,setPostingReply]= useState(false);
  const [loadingAnime,setLoadingAnime]= useState(true);
  const [loadingEps,  setLoadingEps]  = useState(true);
  const [expanded,    setExpanded]    = useState(false);
  const [relatedSeries, setRelatedSeries] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('1080');
  const [selectedAudio, setSelectedAudio] = useState('jpn');
  const qualityOptions = ['1080', '720', '480', '360'];
  const audioOptions = ['jpn', 'eng'];

  // Smart base title extraction for related series search
  const getBaseTitle = (title: string) => title
    .replace(/\s*:\s*.+$/, '')
    .replace(/\s*[-–—]\s*.+/, '')
    .replace(/\s+(the\s+)?final\s+(season|part)\s*$/i, '')
    .replace(/\s+(season|part|cour)\s*\d+\s*$/i, '')
    .replace(/\s+\d+(st|nd|rd|th)\s+season\s*$/i, '')
    .replace(/\s+[IVX]{1,5}\s*$/, '')
    .replace(/\s+\d+\s*$/, '')
    .trim();

  const inWl = isInWatchlist(slug);

  // Track visit automatically
  useEffect(() => {
    if (anime) trackVisit(slug, anime.title, anime.cover);
  }, [anime]);

  useEffect(() => {
    (async () => {
      setLoadingAnime(true);
      let resolvedTitle = initialTitle && !isUuid(initialTitle) ? initialTitle : '';
      
      try {
        // Step 1: Try the /info endpoint (works for some anime)
        const { data } = await animeAPI.getDetail(slug, resolvedTitle);
        const raw = (data && typeof data === 'object')
          ? data.data?.anime || data.data || data.anime || data
          : data;
        if (!raw || (Array.isArray(raw) && raw.length === 0)) throw new Error('Not found');
        const info = extractAnimeData(raw);
        // Only accept if it's a real title
        if (info.title && info.title !== 'Unknown Anime' && !isUuid(info.title)) {
          resolvedTitle = info.title;
        }
        if (resolvedTitle) {
          info.title = resolvedTitle;
          // Try to fetch poster from search since /info often returns empty poster
          if (!info.cover) {
            try {
              const { data: sData } = await animeAPI.search(resolvedTitle);
              const items = Array.isArray(sData) ? sData : sData.results || sData.items || sData.data || [];
              const match = items.find((i: any) => i.session === slug || i.id === slug) || items[0];
              if (match && (match.poster || match.image || match.cover)) {
                info.cover = match.poster || match.image || match.cover;
              }
            } catch {}
          }
        }
        setAnime(info);
        document.title = `${info.title} — AniVerse`;
        // Fetch related seasons/series
        if (resolvedTitle) {
          animeAPI.search(resolvedTitle).then(({ data }) => {
            const items = Array.isArray(data) ? data : data.results || data.data || [];
            const cleaned = resolvedTitle.replace(/(Season \d+|Part \d+|S\d+|\d+(st|nd|rd|th) Season|:.*|-.*).*$/i, '').trim();
            animeAPI.search(cleaned).then(({ data: data2 }) => {
              const items2 = Array.isArray(data2) ? data2 : data2.results || data2.data || [];
              const merged = [...items, ...items2];
              const unique = Array.from(new Map(merged.map(item => [item.session || item.id, item])).values());
              const related = unique.filter(i => {
                if (i.session === slug || i.id === slug) return false;
                const t = String(i.title).toLowerCase();
                return t.includes(cleaned.toLowerCase());
              });
              setRelatedSeries(related);
            }).catch(() => setRelatedSeries(items.filter((i: any) => (i.session !== slug && i.id !== slug))));
          }).catch(() => {});
        }
      } catch {
        // Step 2: /info failed — try to find the title via search API using the slug
        try {
          if (!resolvedTitle) {
            // Search by slug — the API might return this anime in results
            const { data: searchData } = await animeAPI.search(slug);
            const searchItems = Array.isArray(searchData) ? searchData : searchData.results || searchData.data || [];
            const match = searchItems.find((i: any) => i.session === slug || i.id === slug || String(i.id) === slug);
            if (match?.title && !isUuid(String(match.title))) {
              resolvedTitle = String(match.title);
            }
          }
          
          // Step 3: Get episodes to build the anime object
          const { data: epData } = await animeAPI.getEpisodes(slug);
          const raw = epData.episodes || epData.data || epData.results || (Array.isArray(epData) ? epData : []);
          const first = Array.isArray(raw) ? raw[0] : null;
          
          const info = first ? extractAnimeData(first as Record<string,unknown>) : {
            slug, title: '', cover: '', banner: '', description: '', genres: [], score: 0, episodes: 0, status: '', year: '', type: '', in_watchlist: false
          };
          info.title = resolvedTitle || info.title || 'Unknown Anime';
          info.slug = slug;
          if (first) {
            info.cover = info.cover || String((first as any).snapshot || '');
          }
          setAnime(info);
          document.title = `${info.title} — AniVerse`;
        } catch {
          // Final fallback
          if (resolvedTitle) {
            setAnime({ slug, title: resolvedTitle, cover: '', banner: '', description: '', genres: [], score: 0, episodes: 0, status: '', year: '', type: '', in_watchlist: false });
            document.title = `${resolvedTitle} — AniVerse`;
          } else {
            toast('Could not load anime', 'error');
          }
        }
      } finally { setLoadingAnime(false); }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      setLoadingEps(true);
      try {
        // We still load episodes to get episode count for the Watch Now button
        const { data } = await animeAPI.getEpisodes(slug, initialTitle || anime?.title || '');
        const raw = data.info?.episodes || data.episodes || data.data || data.results || (Array.isArray(data) ? data : []);
        setEpisodes(raw.map((ep:Record<string,unknown>,i:number)=>extractEpisode(ep,i)));
      } catch {}
      finally { setLoadingEps(false); }
    })();
  }, [slug]);

  // Fetch related series using smart search
  useEffect(() => {
    const title = anime?.title;
    if (!title) return;
    const query = getBaseTitle(title);
    if (query.length < 2) return;
    animeAPI.search(query).then(({ data }) => {
      const results = data.results || data.items || data.data || (Array.isArray(data) ? data : []);
      const filtered = results
        .filter((r: any) => {
          const t = (r.title || r.name || '').toLowerCase();
          return t && t !== title.toLowerCase();
        })
        .slice(0, 20);
      setRelatedSeries(filtered);
    }).catch(() => {});
  }, [anime?.title]);

  // Fetch trending recommendations (shuffled for variety)
  useEffect(() => {
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
    animeAPI.getTrending().then(({ data }) => {
      const results = data.results || data.items || data.data || (Array.isArray(data) ? data : []);
      setRecommendations(shuffle(results).slice(0, 30));
    }).catch(() => {
      animeAPI.getAiring().then(({ data }) => {
        const results = data.results || data.items || data.data || (Array.isArray(data) ? data : []);
        setRecommendations(shuffle(results).slice(0, 30));
      }).catch(() => {});
    });
  }, []);

  // Fetch Characters, Staff, and Relations
  useEffect(() => {
    if (!slug) return;
    animeAPI.getCharacters(slug).then(({ data }) => setCharacters(data.characters || data || []))
      .catch(() => {});
    animeAPI.getStaff(slug).then(({ data }) => setStaff(data.staff || data || []))
      .catch(() => {});
    animeAPI.getRelations(slug).then(({ data }) => setRelations(data.relations || data || []))
      .catch(() => {});
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

  async function postReply(parentId: number) {
    if (!user) { toast('Sign in to reply','warn'); router.push('/auth'); return; }
    if (!replyText.trim()) return;
    setPostingReply(true);
    try {
      await commentAPI.post(slug, replyText.trim(), parentId);
      setReplyText('');
      setReplyingToId(null);
      await loadCmts(1, false);
      toast('Reply posted!','success');
    } catch(e:any) { toast(e.message,'error'); }
    finally { setPostingReply(false); }
  }

  async function deleteComment(id:number) {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentAPI.delete(id);
      setComments(p => {
        const isTopLevel = p.some(c => c.id === id);
        if (isTopLevel) {
          return p.filter(c => c.id !== id);
        } else {
          return p.map(c => {
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.filter((r: any) => r.id !== id)
              };
            }
            return c;
          });
        }
      });
      setTotalCmts(p=>Math.max(0,p-1));
      toast('Comment deleted!','success');
    } catch {}
  }

  const handleWatchlist = () => {
    if (!anime) return;
    const added = toggleWatchlist({slug,title:anime.title,cover:anime.cover});
    toast(added ? 'Added to watchlist' : 'Removed from watchlist','info');
  };

  const downloadSelected = async () => {
    if (!anime) return;
    const epsToDownload = episodes.filter(ep => selectedEpisodes.includes(ep.id));
    setShowDownloadModal(false);
    setSelectedEpisodes([]);
    for (const ep of epsToDownload) {
      await processDownload(ep, anime, selectedQuality, selectedAudio, toast);
    }
    toast('All selected downloads processed!', 'success');
  };

  const saveEp = async (ep: ReturnType<typeof extractEpisode>) => {
    if (!anime) return;
    await processDownload(ep, anime, selectedQuality, selectedAudio, toast);
  };

  const toggleEpSelection = (id: string) => {
    setSelectedEpisodes(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
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
            <img src={a.cover} alt={a.title}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
              {Math.max(a.episodes, episodes.length) > 0 && (
                <span className="text-s4">
                  {Math.max(a.episodes, episodes.length) === 1 ? '1 Episode' : `Episodes 1 - ${Math.max(a.episodes, episodes.length)}`}
                </span>
              )}
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
              {episodes.length > 0 ? (
                <Link href={`/watch/${slug}/${episodes[0].id}?title=${encodeURIComponent(a.title)}&ep=${episodes[0].num}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-accent text-white hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
                  style={{boxShadow:'0 4px 14px rgba(225,29,72,0.4), inset 0 1px 2px rgba(255,255,255,0.2)'}}>
                  <Play size={16} fill="currentColor" />Watch Now
                </Link>
              ) : (
                <button disabled
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-s3 text-s4 cursor-not-allowed">
                  <Play size={16} fill="currentColor" />No Episodes
                </button>
              )}
              <button onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-accent bg-transparent border-2 border-accent/40 hover:bg-accent/10 hover:border-accent hover:-translate-y-0.5 transition-all">
                <Download size={15}/>Download EP
              </button>
              <button onClick={handleWatchlist}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm border-2 transition-all hover:-translate-y-0.5 ${
                  inWl ? 'bg-s2 border-[var(--border-hi)] text-s5' : 'text-s4 border-transparent bg-s1 hover:bg-s2'
                }`}>
                {inWl ? <BookmarkCheck size={15}/> : <Bookmark size={15}/>}
                {inWl ? 'In Watchlist' : 'Watchlist'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Anime Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4 mt-10 pt-8 border-t border-[var(--border)]">
          {a.format && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Tv size={14} className="text-s3" /> Format
              </div>
              <span className="text-sm font-bold text-s5">{a.format}</span>
            </div>
          )}
          {a.episodes > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Layers size={14} className="text-s3" /> Episodes
              </div>
              <span className="text-sm font-bold text-s5">{a.episodes}</span>
            </div>
          )}
          {a.duration > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Clock size={14} className="text-s3" /> Duration
              </div>
              <span className="text-sm font-bold text-s5">{a.duration} min</span>
            </div>
          )}
          {a.source && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <BookOpen size={14} className="text-s3" /> Source
              </div>
              <span className="text-sm font-bold text-s5">{a.source}</span>
            </div>
          )}
          {(a.season || a.year) && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Calendar size={14} className="text-s3" /> Season
              </div>
              <span className="text-sm font-bold text-s5">
                {a.season ? `${a.season} ${a.year}`.toUpperCase() : a.year}
              </span>
            </div>
          )}
          {((a as any).studios?.length > 0) && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Building2 size={14} className="text-s3" /> Studios
              </div>
              <span className="text-sm font-bold text-s5">
                {(a as any).studios[0].name || (a as any).studios[0]}
              </span>
            </div>
          )}
          {a.genres?.length > 0 && (
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Tags size={14} className="text-s3" /> Genres
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.genres.slice(0,3).map((g: string) => (
                  <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">{g}</span>
                ))}
              </div>
            </div>
          )}
          {(a as any).country && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Flag size={14} className="text-s3" /> Country
              </div>
              <span className="text-sm font-bold text-s5">{(a as any).country}</span>
            </div>
          )}
          {(a as any).popularity > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-s4 text-[11px] font-bold uppercase tracking-wider">
                <Users size={14} className="text-s3" /> Popularity
              </div>
              <span className="text-sm font-bold text-s5">{(a as any).popularity.toLocaleString()} users</span>
            </div>
          )}
        </div>

        {/* Relations (from new API) */}
        {relations.length > 0 && (
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <h2 className="font-display font-bold text-lg text-s5 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-s5 inline-block" />
              Related Anime
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 ep-scroll">
              {relations.map((r: any, i: number) => {
                // The relations API usually returns { id, title, image, relationType }
                const relId = r.id || r.node?.id;
                const relTitle = r.title?.english || r.title?.romaji || r.title?.native || r.title || 'Unknown';
                const relImage = r.image || r.coverImage?.extraLarge || r.coverImage?.large || '';
                const relType = r.relationType || r.type || '';
                return (
                  <Link key={relId || i} href={`/anime/${relId}?title=${encodeURIComponent(relTitle)}`}
                    className="shrink-0 w-32 group">
                    <div className="w-32 h-44 rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all relative mb-2.5"
                      style={{ boxShadow: 'var(--shadow-sm)' }}>
                      {relImage
                        ? <img src={relImage} alt={relTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="w-full h-full flex items-center justify-center"><Play size={22} className="text-s3" /></div>}
                      {relType && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-s5/90 text-white uppercase">{relType.replace(/_/g, ' ')}</span>}
                    </div>
                    <p className="text-xs font-semibold text-s4 group-hover:text-s5 transition-colors line-clamp-2 leading-tight">{relTitle}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Characters */}
        {/* Characters */}
        {characters.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-xl text-white mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded bg-white inline-block shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              Characters
            </h2>
            <div className="flex gap-5 overflow-x-auto pb-6 ep-scroll" style={{ scrollbarWidth: 'none' }}>
              {characters.slice(0, 15).map((c: any, i: number) => {
                const charId = c.id || c.node?.id;
                const charName = c.name?.full || c.name || 'Unknown';
                const charImage = c.image || c.image?.large || '';
                const charRole = c.role || '';
                return (
                  <div key={charId || i} className="shrink-0 w-[85px] flex flex-col items-center group">
                    <div className="w-[85px] h-[85px] rounded-full overflow-hidden bg-s1 group-hover:ring-2 ring-accent/50 transition-all mb-3 shadow-md relative">
                      {charImage ? (
                        <img src={charImage} alt={charName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-s3 font-bold text-xl">{charName[0]}</div>
                      )}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none" />
                    </div>
                    <p className="text-[11px] font-bold text-white text-center leading-tight line-clamp-2 w-full">{charName}</p>
                    {charRole && <p className="text-[9px] text-s4 text-center truncate w-full mt-0.5">{charRole}</p>}
                  </div>
                );
              })}
            </div>
            <div className="w-full h-[1px] bg-white/5 mt-2" />
          </div>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-xl text-white mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded bg-white inline-block shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              Staff
            </h2>
            <div className="flex gap-5 overflow-x-auto pb-6 ep-scroll" style={{ scrollbarWidth: 'none' }}>
              {staff.slice(0, 10).map((s: any, i: number) => {
                const staffId = s.id || s.node?.id;
                const staffName = s.name?.full || s.name || 'Unknown';
                const staffImage = s.image || s.image?.large || '';
                const staffRole = s.role || '';
                return (
                  <div key={staffId || i} className="shrink-0 w-[85px] flex flex-col items-center group">
                    <div className="w-[85px] h-[85px] rounded-full overflow-hidden bg-s1 group-hover:ring-2 ring-accent/50 transition-all mb-3 shadow-md relative">
                      {staffImage ? (
                        <img src={staffImage} alt={staffName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-s3 font-bold text-lg">{staffName[0]}</div>
                      )}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none" />
                    </div>
                    <p className="text-[11px] font-bold text-white text-center leading-tight line-clamp-2 w-full">{staffName}</p>
                    {staffRole && <p className="text-[9px] text-s4 text-center truncate w-full mt-0.5">{staffRole}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* You May Also Like */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-lg text-s5 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-s5 inline-block" />
              You May Also Like
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {recommendations.map((r: any, i: number) => {
                const a = extractAnimeData(r);
                return (
                  <Link key={a.slug || i} href={`/anime/${a.slug}?title=${encodeURIComponent(a.title)}`}
                    className="shrink-0 w-32 group">
                    <div className="w-32 h-44 rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all relative mb-2.5"
                      style={{ boxShadow: 'var(--shadow-sm)' }}>
                      {a.cover
                        ? <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="w-full h-full flex items-center justify-center"><Play size={22} className="text-s3" /></div>}
                      {a.type && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white uppercase">{a.type}</span>}
                    </div>
                    <p className="text-xs font-semibold text-s4 group-hover:text-s5 transition-colors line-clamp-2 leading-tight">{a.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

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
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--border)]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-s2 border border-[var(--border)] flex items-center justify-center font-bold text-sm shrink-0 text-s5">
                  {user.username[0].toUpperCase()}
                </div>
              )}
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

          <div className="space-y-6">
            {comments.map(c => (
              <div key={c.id} className="relative group/thread">
                {/* Vertical thread line - only render if there are replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="absolute left-[15px] top-[36px] bottom-[20px] w-[1px] bg-gradient-to-b from-[var(--border)] to-transparent opacity-40 pointer-events-none" />
                )}
                
                {/* Comment card */}
                <div className="flex gap-3">
                  {/* Avatar — show real profile pic if available */}
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.username} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--border)] relative z-10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white relative z-10"
                      style={{ background: `hsl(${(c.username.charCodeAt(0) * 47) % 360}, 45%, 30%)` }}>
                      {c.username[0].toUpperCase()}
                    </div>
                  )}
                  
                  {/* Comment Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold text-s5">{c.username}</span>
                      {c.email === ADMIN_EMAIL && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Admin</span>
                      )}
                      <span className="text-[10px] text-s3">{c.time}</span>
                      {(user?.username === c.username || user?.email === ADMIN_EMAIL) && (
                        <button onClick={() => deleteComment(c.id)} className="ml-auto text-s3 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-s4 mt-1 leading-relaxed break-words">{c.text}</p>
                    
                    {/* Action Buttons (Reply) */}
                    <div className="flex items-center gap-4 mt-2">
                      {user && (
                        <button
                          onClick={() => {
                            setReplyingToId(replyingToId === c.id ? null : c.id);
                            setReplyText('');
                          }}
                          className="text-[11px] font-semibold text-s3 hover:text-s5 transition-colors flex items-center gap-1"
                        >
                          Reply
                        </button>
                      )}
                    </div>

                    {/* Inline Reply Input */}
                    <AnimatePresence>
                      {replyingToId === c.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="flex gap-2 items-start pl-2">
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover shrink-0 border border-[var(--border)] mt-1" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-s2 border border-[var(--border)] flex items-center justify-center font-bold text-[10px] shrink-0 text-s5 mt-1">
                                {user?.username[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 flex flex-col gap-2">
                              <input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    postReply(c.id);
                                  }
                                }}
                                maxLength={1000}
                                placeholder={`Reply to ${c.username}...`}
                                className="w-full px-3 py-2 rounded-lg bg-s2 border border-[var(--border)] text-xs text-s5 outline-none focus:border-[var(--border-hi)] transition-colors placeholder:text-s3"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setReplyingToId(null)}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-s4 hover:bg-s2 transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => postReply(c.id)}
                                  disabled={postingReply || !replyText.trim()}
                                  className="px-3 py-1 rounded-md bg-s5 text-s0 text-[10px] font-bold disabled:opacity-40 transition-all flex items-center gap-1"
                                >
                                  Send
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Nested Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-11 mt-3 space-y-3">
                    {c.replies.map((r: any) => (
                      <div key={r.id} className="flex gap-3 relative group/reply">
                        {/* L-shaped line connecting reply avatar to the thread line */}
                        <div className="absolute -left-[29px] -top-[6px] w-[18px] h-[18px] border-l border-b border-[var(--border)] opacity-30 rounded-bl-md pointer-events-none" />
                        
                        {r.avatar ? (
                          <img src={r.avatar} alt={r.username} className="w-6 h-6 rounded-full object-cover shrink-0 border border-[var(--border)] relative z-10" />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white relative z-10"
                            style={{ background: `hsl(${(r.username.charCodeAt(0) * 47) % 360}, 45%, 30%)` }}>
                            {r.username[0].toUpperCase()}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-bold text-s5">{r.username}</span>
                            {r.email === ADMIN_EMAIL && (
                              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Admin</span>
                            )}
                            <span className="text-[9px] text-s3">{r.time}</span>
                            {(user?.username === r.username || user?.email === ADMIN_EMAIL) && (
                              <button onClick={() => deleteComment(r.id)} className="ml-auto text-s3 hover:text-red-400 transition-colors">
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-s4 mt-0.5 leading-relaxed break-words">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className="text-s3 text-sm">Be the first to comment!</p>}
          </div>
          {comments.length<totalCmts && (
            <button onClick={()=>loadCmts(cmtPage+1,true)}
              className="mt-5 w-full py-3 bg-s1 border border-[var(--border)] rounded-xl text-sm font-semibold text-s4 hover:bg-s2 hover:text-s5 transition-all">
              Load more comments
            </button>
          )}
        </div>
      </div>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-s1 border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <h3 className="font-display font-bold text-lg text-s5">Download Episodes</h3>
                <button onClick={() => setShowDownloadModal(false)} className="text-s3 hover:text-s5"><X size={20} /></button>
              </div>
              
              {anime && (
                <div className="relative w-full h-28 bg-s2 shrink-0">
                  <img src={anime.cover || anime.banner} alt={anime.title} className="w-full h-full object-cover opacity-60" onError={(e) => (e.currentTarget.style.display='none')} />
                  <div className="absolute inset-0 bg-gradient-to-t from-s1 to-transparent flex flex-col justify-end p-4">
                    <span className="font-bold text-sm text-white drop-shadow-md truncate">{anime.title}</span>
                  </div>
                </div>
              )}
              
              <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)] shrink-0 bg-s1/50">
                <span className="text-xs font-bold text-s4 uppercase tracking-widest">Settings</span>
                <div className="flex gap-2">
                  <select value={selectedQuality} onChange={e => setSelectedQuality(e.target.value)}
                    className="bg-s2 border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-s5 outline-none cursor-pointer">
                    {qualityOptions.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)}
                    className="bg-s2 border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-s5 outline-none cursor-pointer uppercase">
                    {audioOptions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 ep-scroll">
                <p className="text-xs font-bold text-s4 uppercase tracking-widest px-2 mb-2 mt-4">Save to Device</p>
                {episodes.map(ep => {
                  const isSelected = selectedEpisodes.includes(ep.id);
                  return (
                    <div key={ep.id} onClick={() => toggleEpSelection(ep.id)}
                      className={`flex items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-s5/10 border-s5/30' : 'border-transparent hover:bg-s2'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-s5 border-s5' : 'border-s3'}`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-s5' : 'text-s4'}`}>EP {ep.num}</div>
                        <div className="text-sm text-s5 line-clamp-1 font-medium">{ep.title}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); saveEp(ep); }}
                        className="p-2.5 rounded-xl bg-s2 text-s4 hover:bg-s5 hover:text-white transition-all">
                        <Download size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {selectedEpisodes.length > 0 && (
                <div className="p-4 border-t border-[var(--border)] bg-s2">
                  <button onClick={downloadSelected}
                    className="w-full py-3.5 rounded-xl bg-s5 text-white font-bold hover:bg-s4 transition-colors flex items-center justify-center gap-2">
                    <Download size={18} /> Download {selectedEpisodes.length} Selected
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
