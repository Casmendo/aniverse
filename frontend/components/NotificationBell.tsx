'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, MessageSquare, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notificationAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface Notif {
  id: number;
  anime_slug: string;
  sender: string;
  sender_avatar: string | null;
  text: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [newToast, setNewToast] = useState<Notif | null>(null);
  const prevIds = useRef<Set<number>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationAPI.getAll();
      const list: Notif[] = data.notifications || [];
      
      // Find newly arrived ones
      const newOnes = list.filter(n => !n.read && !prevIds.current.has(n.id));
      if (newOnes.length > 0) {
        const newest = newOnes[0];
        setNewToast(newest);
        // APK push notification
        if (Capacitor.isNativePlatform()) {
          try {
            await LocalNotifications.requestPermissions();
            await LocalNotifications.schedule({ notifications: [{
              id: newest.id,
              title: `${newest.sender} replied to your comment`,
              body: newest.text.slice(0, 100),
              schedule: { at: new Date(Date.now() + 200) },
            }]});
          } catch {}
        }
        setTimeout(() => setNewToast(null), 5000);
      }
      newOnes.forEach(n => prevIds.current.add(n.id));
      list.forEach(n => prevIds.current.add(n.id));
      setNotifs(list);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user, fetchNotifs]);

  // Close panel on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markRead = async (n: Notif) => {
    if (!n.read) {
      try { await notificationAPI.markRead(n.id); } catch {}
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    setOpen(false);
    router.push(`/anime/${n.anime_slug}#comments`);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-s2 transition-colors text-s4 hover:text-s5"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[8px] font-black flex items-center justify-center leading-none shadow-md">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-[#0d1b22]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Bell size={14} /> Notifications
                {unread > 0 && <span className="text-xs text-rose-400">({unread} new)</span>}
              </span>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <Bell size={28} className="text-white/20" />
                  <p className="text-xs text-white/30">No notifications yet</p>
                </div>
              ) : (
                notifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${!n.read ? 'bg-s5/5' : ''}`}
                  >
                    {n.sender_avatar ? (
                      <img src={n.sender_avatar} alt={n.sender} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 mt-0.5"
                        style={{ background: `hsl(${(n.sender.charCodeAt(0) * 47) % 360}, 45%, 30%)` }}>
                        {n.sender[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80">
                        <span className="font-bold text-white">{n.sender}</span> replied to your comment
                      </p>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{n.text}</p>
                      <p className="text-[9px] text-white/30 mt-1">{n.created_at}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-s5 mt-1.5 shrink-0" />}
                    <ChevronRight size={12} className="text-white/20 mt-1 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Web Toast notification */}
      <AnimatePresence>
        {newToast && (
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 z-[100] w-72 bg-[#0d1b22]/98 backdrop-blur-xl border border-s5/30 rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => { markRead(newToast); setNewToast(null); }}
          >
            <div className="h-0.5 bg-gradient-to-r from-s5 to-transparent" />
            <div className="flex items-start gap-3 p-4">
              {newToast.sender_avatar ? (
                <img src={newToast.sender_avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ background: `hsl(${(newToast.sender.charCodeAt(0) * 47) % 360}, 45%, 30%)` }}>
                  {newToast.sender[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare size={10} className="text-s5" />
                  <p className="text-[10px] text-s4 font-semibold uppercase tracking-wide">New Reply</p>
                </div>
                <p className="text-xs text-white">
                  <span className="font-bold">{newToast.sender}</span> replied to your comment
                </p>
                <p className="text-[10px] text-white/50 mt-0.5 truncate">{newToast.text}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setNewToast(null); }} className="text-white/30 hover:text-white shrink-0">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
