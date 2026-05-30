'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Heart } from 'lucide-react';

export default function WelcomeNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('aniverse_welcome_seen');
    const now = Date.now();
    if (!lastSeen || now - parseInt(lastSeen) > 24 * 60 * 60 * 1000) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  const close = () => {
    setShow(false);
    localStorage.setItem('aniverse_welcome_seen', Date.now().toString());
  };

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => close(), 10000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-[999] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="bg-s1/95 backdrop-blur-xl border border-s5/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            {/* Progress Bar for auto-close */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-s5 to-s4"
            />
            
            <button onClick={close} className="absolute top-3 right-3 text-s3 hover:text-s5 transition-colors">
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center gap-3 mt-2">
              <div className="w-12 h-12 bg-gradient-to-tr from-s5 to-s4 rounded-2xl shadow-lg shadow-s5/20 flex items-center justify-center mb-1">
                <span className="font-display font-black text-2xl text-white">A</span>
              </div>
              
              <h3 className="font-display font-bold text-xl text-s5 leading-tight">
                Welcome to AniVerse!
              </h3>
              
              <p className="text-sm text-s4 leading-relaxed px-2">
                Experience ad-free anime streaming with ultra-fast servers.
              </p>
              
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-s3 bg-s2/50 px-3 py-1.5 rounded-full border border-[var(--border)] mt-1">
                <Code size={12} className="text-s5" /> 
                Built with <Heart size={12} fill="currentColor" className="text-red-500 mx-0.5" /> by <span className="text-s5 font-bold">Leo</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
