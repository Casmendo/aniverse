'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type T = 'success'|'error'|'info'|'warn';
interface Toast { id:string; msg:string; type:T; }

const Ctx = createContext<(msg:string,type?:T)=>void>(()=>{});
export const useToast = () => useContext(Ctx);

const ICONS: Record<T,React.ReactNode> = {
  success:<CheckCircle2  size={16} className="text-emerald-400 shrink-0"/>,
  error:  <XCircle       size={16} className="text-red-400 shrink-0"/>,
  info:   <Info          size={16} className="text-s4 shrink-0"/>,
  warn:   <AlertTriangle size={16} className="text-yellow-400 shrink-0"/>,
};

export function ToastProvider({children}:{children:React.ReactNode}) {
  const [toasts,setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg:string,type:T='info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3800);
  },[]);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed top-[76px] right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{opacity:0,x:40,scale:0.95}}
              animate={{opacity:1,x:0,scale:1}}
              exit={{opacity:0,x:40,scale:0.95}}
              transition={{duration:0.3,ease:[0.16,1,0.3,1]}}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl min-w-[240px] max-w-[320px] pointer-events-auto glass border border-[var(--border)]"
              style={{boxShadow:'var(--shadow)'}}>
              {ICONS[t.type]}
              <span className="text-sm text-s5 flex-1">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
