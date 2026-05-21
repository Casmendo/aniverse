'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useIntroStore } from '@/store/introStore';
import { useToast } from '@/components/Toast';
import { authAPI } from '@/lib/api';

type Screen = 'tabs' | 'otp' | 'success' | 'forgot_email' | 'forgot_reset';
type Tab    = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const toast  = useToast();
  const { user } = useAuthStore();

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

  // Forgot Password
  const [fEmail, setFEmail] = useState('');
  const [fPw,    setFPw]    = useState('');
  const [fPwConf,setFPwConf]= useState('');

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
      useIntroStore.getState().triggerIntro();
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
      setTimeout(()=>{
        useIntroStore.getState().triggerIntro();
        router.replace('/');
      }, 2000);
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Incorrect OTP. Try again.');
      setOtp(['','','','','','']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setErr(''); setLoading(true);
    try {
      if (screen === 'forgot_reset') {
        await authAPI.forgotPassword(fEmail.trim());
      } else {
        await authAPI.resendOtp(sEmail.trim());
      }
      toast(`New code sent!`, 'success');
      setOtp(['','','','','','']);
      startTimers();
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Failed to resend');
    } finally { setLoading(false); }
  };

  const handleForgotEmail = async () => {
    setErr(''); setLoading(true);
    try {
      if (!fEmail.includes('@')) throw new Error('Valid email required');
      await authAPI.forgotPassword(fEmail.trim());
      toast(`Reset code sent to ${fEmail}`, 'info');
      setScreen('forgot_reset');
      startTimers();
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    setErr(''); setLoading(true);
    try {
      const code = otp.join('');
      if (code.length !== 6) throw new Error('Enter 6-digit code');
      if (fPw.length < 8) throw new Error('Password must be at least 8 characters');
      if (fPw !== fPwConf) throw new Error('Passwords do not match');
      
      await authAPI.resetPassword(fEmail.trim(), code, fPw);
      clearInterval(timerRef.current); clearInterval(resendRef.current);
      toast('Password reset successfully! Please sign in.', 'success');
      setScreen('tabs'); setTab('login');
      setLPw(''); setOtp(['','','','','','']);
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #253745 0%, transparent 70%)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
           <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-s5/20 flex items-center justify-center">
             <div className="w-12 h-12 bg-gradient-to-br from-s4 to-s5 rounded-full" />
           </motion.div>
        </div>
        <div className="bg-[#111] border border-white/10 p-8 rounded-[2rem] shadow-2xl">
          <AnimatePresence mode="wait">
            {screen === 'tabs' && (
              <motion.div key="tabs" exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex bg-black/40 p-1.5 rounded-full">
                  {(['login','signup'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${tab === t ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                      {t === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
                {err && <p className="text-red-400 text-xs text-center">{err}</p>}
                {tab === 'login' ? (
                  <div className="space-y-4">
                    <Field icon={<Mail size={16}/>} type="email" placeholder="Email" value={lEmail} onChange={setLEmail}/>
                    <Field icon={<Lock size={16}/>} type="password" placeholder="Password" value={lPw} onChange={setLPw}/>
                    <button onClick={() => setScreen('forgot_email')} className="text-xs text-white/40 hover:text-white transition-colors w-full text-right">Forgot password?</button>
                    <AuthBtn loading={loading} onClick={handleLogin}>Log In</AuthBtn>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Field icon={<User size={16}/>} type="text" placeholder="Username" value={sName} onChange={setSName}/>
                    <Field icon={<Mail size={16}/>} type="email" placeholder="Email" value={sEmail} onChange={setSEmail}/>
                    <Field icon={<Lock size={16}/>} type="password" placeholder="Password" value={sPw} onChange={setSPw}/>
                    <div className="flex gap-1.5 h-1">
                      {strColors.map((c, i) => <div key={i} className="flex-1 rounded-full transition-colors" style={{ backgroundColor: i < str ? c : '#333' }} />)}
                    </div>
                    <AuthBtn loading={loading} onClick={handleSignup}>Join AniVerse</AuthBtn>
                  </div>
                )}
              </motion.div>
            )}
            {screen === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 text-center">
                <h2 className="text-2xl font-bold text-white">Verification</h2>
                <p className="text-sm text-white/60">Enter the code sent to {sEmail}</p>
                {err && <p className="text-red-400 text-xs">{err}</p>}
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((n, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" maxLength={1} value={n} onChange={e => handleOtpInput(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-white/30 outline-none" />
                  ))}
                </div>
                <button disabled={!canResend} onClick={handleResend} className="text-xs text-white/40 disabled:opacity-50">
                  {canResend ? 'Resend Code' : `Resend in ${fmtTimer(resendCD)}`}
                </button>
              </motion.div>
            )}
            {screen === 'forgot_email' && (
              <motion.div key="femail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <h2 className="text-xl font-bold text-white">Reset Password</h2>
                {err && <p className="text-red-400 text-xs text-center">{err}</p>}
                <Field icon={<Mail size={16}/>} type="email" placeholder="Enter your email" value={fEmail} onChange={setFEmail}/>
                <AuthBtn loading={loading} onClick={handleForgotEmail}>Send Reset Code</AuthBtn>
              </motion.div>
            )}
            {screen === 'forgot_reset' && (
              <motion.div key="freset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-white">Verification</h2>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((n, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" maxLength={1} value={n} onChange={e => handleOtpInput(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)} className="w-10 h-12 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-white/30 outline-none" />
                  ))}
                </div>
                <Field icon={<Lock size={16}/>} type="password" placeholder="New Password" value={fPw} onChange={setFPw}/>
                <Field icon={<Lock size={16}/>} type="password" placeholder="Confirm Password" value={fPwConf} onChange={setFPwConf}/>
                <AuthBtn loading={loading} onClick={handleResetPassword}>Update Password</AuthBtn>
              </motion.div>
            )}
            {screen === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto"><Check size={32}/></div>
                <h2 className="text-2xl font-bold text-white">Welcome!</h2>
                <p className="text-white/60">Your account is ready.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon, type, placeholder, value, onChange }: { icon: React.ReactNode, type: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors">{icon}</div>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-2xl text-white outline-none focus:border-white/30 transition-all" />
    </div>
  );
}

function AuthBtn({ loading, onClick, children }: { loading: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading} className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center">
      {loading ? <span className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" /> : children}
    </button>
  );
}
