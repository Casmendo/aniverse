'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] gap-6 text-center px-6">
      <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.5,ease:[0.16,1,0.3,1]}}>
        <div className="font-display font-black leading-none text-s2"
          style={{fontSize:'clamp(7rem,20vw,14rem)'}}>
          404
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.5,ease:[0.16,1,0.3,1]}}>
        <h1 className="font-display font-bold text-xl text-s5 mb-2">Lost in the Multiverse</h1>
        <p className="text-sm text-s3 max-w-xs mb-7">This dimension doesn't exist. Let's get you back.</p>
        <Link href="/"
          className="px-8 py-3.5 rounded-full bg-s5 text-s0 font-display font-bold text-sm hover:bg-s4 hover:-translate-y-0.5 transition-all"
          style={{boxShadow:'var(--shadow)'}}>
          ← Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
