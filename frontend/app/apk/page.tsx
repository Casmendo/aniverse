'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Play, Wifi, HardDrive, Smartphone, Star, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Play,       label: '4K Streaming'     },
  { icon: HardDrive,  label: 'Offline Mode'      },
  { icon: Wifi,       label: 'Subtitles'         },
  { icon: Smartphone, label: 'Mobile First'      },
  { icon: Star,       label: 'No Ads'            },
  { icon: Shield,     label: 'Secure'            },
];

export default function APKPage() {
  const [progress, setProgress] = useState(0);
  const [started,  setStarted]  = useState(false);
  const [done,     setDone]     = useState(false);

  const start = () => {
    setStarted(true);
    let p = 0;
    const iv = setInterval(()=>{
      p += Math.random()*10 + 3;
      if (p>=100) { 
        p=100; 
        clearInterval(iv); 
        setDone(true); 
        // Trigger real download
        window.location.assign('https://files.catbox.moe/orvwu7.apk');
      }
      setProgress(Math.min(100,p));
    }, 140);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* BG accent */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background:'radial-gradient(ellipse 60% 40% at 50% 20%,rgba(37,55,69,0.25) 0%,transparent 70%)',
      }} />

      {/* App icon */}
      <motion.div
        animate={{ y:[0,-10,0] }}
        transition={{ duration:4, ease:'easeInOut', repeat:Infinity }}
        className="w-28 h-28 rounded-[28px] overflow-hidden bg-s1 border border-[var(--border)] flex items-center justify-center mb-8 relative"
        style={{boxShadow:'var(--shadow-lg)'}}>
        <img src="https://files.catbox.moe/35xldc.png" alt="AniVerse" className="w-full h-full object-cover" />
        {/* Notification dot */}
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-s5 border-2 border-s1" />
      </motion.div>

      <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1,ease:[0.16,1,0.3,1]}}
        className="font-display font-black text-s5 mb-2"
        style={{fontSize:'clamp(2rem,5vw,3rem)'}}>
        AniVerse
      </motion.h1>

      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}
        className="font-mono text-s3 text-[11px] tracking-[.2em] uppercase mb-5">
        Enter the Anime Multiverse
      </motion.p>

      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
        className="text-s4 text-sm max-w-md leading-relaxed mb-10">
        Stream thousands of anime on your phone, download for offline viewing,
        and never miss an episode — all in a cinematic mobile experience.
      </motion.p>

      {/* Features */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.4,ease:[0.16,1,0.3,1]}}
        className="flex flex-wrap gap-2.5 justify-center mb-10 max-w-lg">
        {FEATURES.map(({icon:Icon,label},i)=>(
          <motion.div key={label}
            initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
            transition={{delay:0.4+i*0.04,ease:[0.16,1,0.3,1]}}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-s1 border border-[var(--border)] text-sm font-medium text-s4"
            style={{boxShadow:'var(--shadow-sm)'}}>
            <Icon size={14} className="text-s5"/>
            {label}
          </motion.div>
        ))}
      </motion.div>

      {/* Download button */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.6,ease:[0.16,1,0.3,1]}}
        className="flex flex-col items-center gap-3 w-full max-w-xs">
        {!started ? (
          <button onClick={start}
            className="w-full inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-s5 text-s0 font-display font-bold text-base hover:bg-s4 hover:-translate-y-0.5 transition-all"
            style={{boxShadow:'var(--shadow-lg)'}}>
            <Download size={22}/>
            Download APK
          </button>
        ) : (
          <div className="w-full space-y-3">
            <div className={`w-full inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-display font-bold text-base transition-all ${
              done ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-s2 text-s5'
            }`}>
              {done ? (
                <><span>✓</span> Download Complete!</>
              ) : (
                <><span className="w-4 h-4 border-2 border-s4 border-t-s5 rounded-full animate-spin"/>Downloading…</>
              )}
            </div>
            <div className="h-1 bg-s2 rounded-full overflow-hidden">
              <div className="h-full bg-s5 rounded-full transition-all duration-150"
                style={{width:`${progress}%`}} />
            </div>
            <p className="text-s3 text-xs font-mono text-center">{Math.round(progress)}%</p>
          </div>
        )}
        <p className="text-[10px] text-s3 font-mono">v2.0.0 · Android 6.0+ · ~22 MB</p>
      </motion.div>

      {/* Ratings */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8}}
        className="mt-14 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {Array.from({length:5}).map((_,i)=>(
            <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#CCD0CF" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ))}
        </div>
        <p className="font-display font-bold text-lg text-s5">4.9 / 5.0</p>
        <p className="text-sm text-s3">Based on 24,391 ratings</p>
      </motion.div>
    </div>
  );
}
