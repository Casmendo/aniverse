'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/Toast';
import { authAPI } from '@/lib/api';

type Screen = 'tabs' | 'otp' | 'success';
type Tab    = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const toast  = useToast();
  const { user, login, signup } = useAuthStore();

  const [screen, setScreen] = useState<Screen>('tabs');
  const [tab,    setTab]    = useState<Tab>('login');
  const [err,    setErr]    = useState('');
  const [loading,setLoading]= useState(false);
  const [showPw, setShowPw] = useState(false);

  // Login
  const [lEmail, setLEmail] = useState('');
  const [lPw,    setLPw]    = useState('');

  // Signup
  const [sName,  setSName]  = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPw,    setSPw]    = useState('');

  // OTP
  const [otp,      setOtp]      = useState(['','','','','','']);
  const [pendingOtp,setPendingOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [resendCD, setResendCD] = useState(30);
  const [canResend,setCanResend]= useState(false);
  const otpRefs   = useRef<(HTMLInputElement|null)[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval>>();
  const resendRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => { if (user) router.replace('/'); }, [user]);

  const pwStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    return s;
  };
  const str = pwStrength(sPw);
  const strColors = ['#f87171','#fbbf24','#34d399'];

  const startTimers = () => {
    clearInterval(timerRef.current); clearInterval(resendRef.current);
    setOtpTimer(60); setResendCD(30); setCanResend(false);
    timerRef.current  = setInterval(()=>setOtpTimer(p=>{ if(p<=1){clearInterval(timerRef.current);return 0;} return p-1; }),1000);
    resendRef.current = setInterval(()=>setResendCD(p=>{ if(p<=1){clearInterval(resendRef.current);setCanResend(true);return 0;} return p-1; }),1000);
  };

  const fmtTimer = (s:number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const handleLogin = async () => {
    setErr(''); setLoading(true);
    try {
      const { data } = await authAPI.login({ email: lEmail, password: lPw });
      useAuthStore.setState({ user: data.user, token: data.token });
      toast('Welcome back!', 'success');
      router.replace('/');
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setErr(''); setLoading(true);
    try {
      // Pre-validate before API call
      if (!sName.trim() || sName.trim().length < 3) throw new Error('Username must be at least 3 characters');
      if (!sEmail.includes('@')) throw new Error('Valid email required');
      if (sPw.length < 8)        throw new Error('Password must be at least 8 characters');
      if (!/[A-Z]/.test(sPw))    throw new Error('Password needs 1 uppercase letter');
      if (!/[0-9]/.test(sPw))    throw new Error('Password needs 1 number');

      await authAPI.signup({ username: sName.trim(), email: sEmail.trim(), password: sPw });
      toast(`OTP sent to ${sEmail}`, 'info');
      setScreen('otp');
      startTimers();
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  const handleOtpInput = (i:number, val:string) => {
    const d = val.replace(/\D/g,'').slice(-1);
    const n = [...otp]; n[i]=d; setOtp(n);
    if (d && i<5) otpRefs.current[i+1]?.focus();
    const code = n.join('');
    if (code.length===6) verifyOtp(code);
  };

  const handleOtpKey = (i:number, e:React.KeyboardEvent) => {
    if (e.key==='Backspace' && !otp[i] && i>0) otpRefs.current[i-1]?.focus();
  };

  const handlePaste = (e:React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    const n = [...otp];
    text.split('').forEach((ch,i)=>{ n[i]=ch; });
    setOtp(n);
    otpRefs.current[Math.min(text.length,5)]?.focus();
    if (text.length===6) verifyOtp(text);
  };

  const verifyOtp = async (code:string) => {
    setErr(''); setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp(sEmail.trim(), code);
      clearInterval(timerRef.current); clearInterval(resendRef.current);
      useAuthStore.setState({ user: data.user, token: data.token });
      setScreen('success');
      setTimeout(()=>router.replace('/'), 2000);
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Incorrect OTP. Try again.');
      setOtp(['','','','','','']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setErr(''); setLoading(true);
    try {
      await authAPI.resendOtp(sEmail.trim());
      toast(`New OTP sent!`, 'success');
      setOtp(['','','','','','']);
      startTimers();
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Failed to resend');
    } finally { setLoading(false); }
  };

  const panel = {
    hidden:  { opacity:0, y:24, scale:0.97 },
    visible: { opacity:1, y:0,  scale:1,   transition:{ duration:0.5, ease:[0.16,1,0.3,1] } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      {/* BG texture */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background:'radial-gradient(ellipse 80% 60% at 20% 10%,rgba(37,55,69,0.3) 0%,transparent 60%)',
      }} />

      <motion.div className="w-full max-w-[420px] relative" variants={panel} initial="hidden" animate="visible">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display font-black text-2xl text-s5 mb-2">
            <svg viewBox="0 0 34 38" fill="none" className="w-7 h-8">
              <defs>
                <linearGradient id="authGrad" x1="0" y1="0" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#CCD0CF"/>
                  <stop offset="100%" stopColor="#4A5C6A"/>
                </linearGradient>
              </defs>
              <path d="M17 2L32 36H24L21 29H13L10 36H2Z" fill="url(#authGrad)"/>
              <path d="M17 10L22 26H12Z" fill="#06141B"/>
            </svg>
            niVerse
          </div>
          <p className="text-s3 text-[10px] font-mono tracking-[.2em] uppercase">Enter the Multiverse</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl px-7 py-8 border border-[var(--border)]" style={{boxShadow:'var(--shadow-lg)'}}>
          <AnimatePresence mode="wait">

            {/* ── Login / Signup ── */}
            {screen === 'tabs' && (
              <motion.div key="tabs"
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                transition={{duration:0.25}}>

                {/* Tab switcher */}
                <div className="flex p-1 bg-s0 rounded-xl mb-6 gap-1">
                  {(['login','signup'] as Tab[]).map(t => (
                    <button key={t} onClick={()=>{setTab(t);setErr('');}}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all duration-250 ${
                        tab===t ? 'bg-s2 text-s5' : 'text-s3 hover:text-s4'
                      }`}>
                      {t==='login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {err && (
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                    className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                    {err}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {tab === 'login' ? (
                    <motion.div key="login"
                      initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:16}}
                      transition={{duration:0.25}} className="space-y-3">
                      <Field icon={<Mail size={14}/>} type="email"     placeholder="Email"    value={lEmail} onChange={setLEmail} onEnter={handleLogin}/>
                      <Field icon={<Lock size={14}/>} type={showPw?'text':'password'} placeholder="Password" value={lPw}    onChange={setLPw}    onEnter={handleLogin}
                        right={<button onClick={()=>setShowPw(!showPw)} className="text-s3 hover:text-s4 transition-colors">{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button>}/>
                      <AuthBtn loading={loading} onClick={handleLogin}>Sign In</AuthBtn>
                      <p className="text-center text-xs text-s3 pt-1">
                        No account?{' '}
                        <button onClick={()=>setTab('signup')} className="text-s5 font-semibold hover:underline">Sign up</button>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="signup"
                      initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}}
                      transition={{duration:0.25}} className="space-y-3">
                      <Field icon={<User size={14}/>} type="text"  placeholder="Username (3–32)"  value={sName}  onChange={setSName}/>
                      <Field icon={<Mail size={14}/>} type="email" placeholder="Email"             value={sEmail} onChange={setSEmail}/>
                      <Field icon={<Lock size={14}/>} type={showPw?'text':'password'} placeholder="Password (8+, uppercase, number)"
                        value={sPw} onChange={setSPw} onEnter={handleSignup}
                        right={<button onClick={()=>setShowPw(!showPw)} className="text-s3 hover:text-s4 transition-colors">{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button>}/>
                      {/* Strength bars */}
                      {sPw && (
                        <div className="flex gap-1">
                          {[1,2,3].map(s => (
                            <div key={s} className="flex-1 h-0.5 rounded-full transition-all duration-300"
                              style={{background: s<=str ? strColors[str-1] : 'var(--border)'}} />
                          ))}
                        </div>
                      )}
                      <AuthBtn loading={loading} onClick={handleSignup}>Create Account →</AuthBtn>
                      <p className="text-center text-xs text-s3 pt-1">
                        Already have an account?{' '}
                        <button onClick={()=>setTab('login')} className="text-s5 font-semibold hover:underline">Sign in</button>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── OTP ── */}
            {screen === 'otp' && (
              <motion.div key="otp"
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                transition={{duration:0.4,ease:[0.16,1,0.3,1]}}
                className="text-center">
                <div className="text-4xl mb-4">📬</div>
                <h2 className="font-display font-bold text-lg text-s5 mb-1">Verify your email</h2>
                <p className="text-xs text-s3 mb-1">A 6-digit code was sent to</p>
                <p className="text-sm font-bold text-s5 mb-6">{sEmail}</p>
                <p className="text-xs text-s3 mb-3 italic">(Check the toast notification for DEV code)</p>

                {err && (
                  <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{err}</div>
                )}

                <div className="flex gap-2 justify-center mb-5">
                  {otp.map((d,i) => (
                    <input key={i} ref={el=>{otpRefs.current[i]=el;}}
                      value={d} maxLength={1} inputMode="numeric"
                      className={`otp-box ${d?'filled':''}`}
                      onChange={e=>handleOtpInput(i,e.target.value)}
                      onKeyDown={e=>handleOtpKey(i,e)}
                      onPaste={handlePaste}
                      autoFocus={i===0} />
                  ))}
                </div>

                <p className="text-xs text-s3 mb-4 font-mono">
                  Expires in <span className="text-s5 font-bold">{fmtTimer(otpTimer)}</span>
                </p>

                <AuthBtn loading={loading} onClick={()=>verifyOtp(otp.join(''))}>Verify &amp; Continue</AuthBtn>

                <button onClick={handleResend} disabled={!canResend}
                  className="mt-3 w-full py-3 rounded-xl border border-[var(--border)] text-xs font-semibold text-s4 hover:bg-s1 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <RotateCcw size={12} />
                  {canResend ? 'Resend Code' : `Resend in ${resendCD}s`}
                </button>

                <button onClick={()=>{setScreen('tabs');setErr('');}}
                  className="mt-3 text-xs text-s3 hover:text-s4 transition-colors">
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ── Success ── */}
            {screen === 'success' && (
              <motion.div key="success"
                initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
                transition={{duration:0.4,ease:[0.16,1,0.3,1]}}
                className="text-center py-4">
                <CheckCircle2 size={52} className="text-emerald-400 mx-auto mb-4" />
                <h2 className="font-display font-bold text-xl text-s5 mb-2">Welcome to AniVerse!</h2>
                <p className="text-sm text-s3 mb-5">Your account is ready. Redirecting…</p>
                <div className="h-0.5 bg-s2 rounded-full overflow-hidden">
                  <div className="h-full bg-s5 rounded-full"
                    style={{animation:'heroBar 2s linear forwards'}} />
                </div>
                <style>{`@keyframes heroBar{from{width:0%}to{width:100%}}`}</style>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Field({icon,type,placeholder,value,onChange,onEnter,right}:{
  icon:React.ReactNode; type:string; placeholder:string;
  value:string; onChange:(v:string)=>void; onEnter?:()=>void; right?:React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-s0 border border-[var(--border)] focus-within:border-[var(--border-hi)] transition-colors">
      <span className="text-s3 shrink-0">{icon}</span>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e=>onChange(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&onEnter?.()}
        className="flex-1 bg-transparent outline-none text-sm text-s5 placeholder:text-s3 font-body" />
      {right}
    </div>
  );
}

function AuthBtn({loading,onClick,children}:{loading:boolean;onClick:()=>void;children:React.ReactNode}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-3.5 rounded-xl bg-s5 text-s0 font-display font-bold text-sm tracking-wider hover:bg-s4 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
      style={{boxShadow:'var(--shadow)'}}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-s0 border-t-transparent rounded-full animate-spin" />
          Loading…
        </span>
      ) : children}
    </button>
  );
}
