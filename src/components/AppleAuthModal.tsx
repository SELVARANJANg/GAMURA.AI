import React, { useState } from 'react';
import {
  X,
  Lock,
  User as UserIcon,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  loginWithEmailOrUsername,
  registerWithUserAndNick,
  loginWithGoogle,
} from '../firebase/config';

interface AppleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nickname: string) => void;
  onSkip: () => void;
  onShowToast: (msg: string) => void;
}

export const AppleAuthModal: React.FC<AppleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSkip,
  onShowToast,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [domainNotice, setDomainNotice] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  if (!isOpen) return null;

  // Compute password strength (0 to 4)
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard?.writeText(currentHostname);
      setCopiedDomain(true);
      onShowToast('Domain copied to clipboard!');
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanNick = nickname.trim();

    if (!cleanUser) {
      onShowToast('Please enter a username or email');
      return;
    }
    if (password.length < 6) {
      onShowToast('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const user = await registerWithUserAndNick(cleanUser, cleanNick || cleanUser, password);
        onShowToast(`Welcome, ${user.displayName || cleanNick || cleanUser}!`);
        onSuccess(user.displayName || cleanNick || cleanUser);
      } else {
        const user = await loginWithEmailOrUsername(cleanUser, password);
        onShowToast(`Signed in as ${user.displayName || cleanUser}`);
        onSuccess(user.displayName || cleanUser);
      }
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Authentication failed';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Invalid username or password';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Username or email already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Use letters & numbers.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password provider not enabled in Firebase Console.';
      }
      onShowToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setDomainNotice(false);
    try {
      const user = await loginWithGoogle();
      onShowToast(`Welcome, ${user.displayName || 'Gamura User'}!`);
      onSuccess(user.displayName || 'Gamura User');
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup deliberately, no error needed
        return;
      }

      if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain')
      ) {
        console.warn(
          `Firebase Google Sign-In notice: Domain "${currentHostname}" must be added to Firebase Console > Authentication > Settings > Authorized Domains.`
        );
        setDomainNotice(true);
        onShowToast('Domain needs authorization in Firebase Console');
        return;
      }

      if (err.code === 'auth/popup-blocked') {
        onShowToast('Popup was blocked by browser. Please allow popups.');
        return;
      }

      onShowToast(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center overflow-hidden">
      {/* Full-screen Backdrop with deep blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom-up Sliding Panel in Signature Apple White Theme */}
      <div
        className="relative w-full max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-[36px] sm:rounded-[36px] bg-white text-slate-900 border border-slate-200/90 shadow-[0_24px_70px_rgba(0,0,0,0.22)] flex flex-col z-10 animate-in slide-in-from-bottom duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Gamura AI Authentication"
      >
        {/* Apple Style Top Grab / Slide Bar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-3 mb-1 shrink-0" />

        {/* Top Controls */}
        <div className="flex items-center justify-between px-6 pt-2 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#19d07f] shadow-[0_0_8px_#19d07f]" />
            <span className="text-[11.5px] font-bold text-slate-500 tracking-wider uppercase">
              Apple ID • Gamura Passkey
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all active:scale-90 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Content with Apple-Style Round Dragon Emblem */}
        <div className="px-6 pt-1 pb-2 text-center shrink-0">
          {/* Round Shape Logo with Ambient Glow */}
          <div className="relative w-20 h-20 mx-auto mb-2.5 flex items-center justify-center">
            {/* Chromatic subtle aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#19d07f] via-[#0a84ff] to-[#bf5af2] blur-lg opacity-40 pointer-events-none" />

            {/* Specular circular bezel */}
            <div className="relative w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#19d07f] via-[#0a84ff] to-[#bf5af2] shadow-[0_8px_20px_rgba(10,132,255,0.22)] flex items-center justify-center">
              {/* Inner Round Badge with Dragon Emblem */}
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden shadow-inner p-1">
                <img
                  src="/assets/gamura-logo.png"
                  alt="Gamura AI Logo"
                  className="w-full h-full rounded-full object-cover object-center drop-shadow-sm transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          </div>

          <h2 className="text-[23px] sm:text-[25px] font-extrabold tracking-tight text-slate-900">
            {isSignUp ? 'Create Gamura Account' : 'Sign in to Gamura AI'}
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 leading-relaxed max-w-[320px] mx-auto font-normal">
            Real-time synchronization across all your devices and models.
          </p>

          {/* Cupertino Segmented Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-[14px] mt-3.5 max-w-[280px] mx-auto border border-slate-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.1)]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.1)]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              New Account
            </button>
          </div>
        </div>

        {/* Form Inputs with Apple Light Aesthetic */}
        <form onSubmit={handleSubmit} className="px-6 space-y-3 pt-1 pb-2">
          {/* Username / Email */}
          <div className="space-y-1 text-left">
            <label className="text-[12px] font-semibold text-slate-700 ml-1">
              Username or Email
            </label>
            <div className="relative flex items-center rounded-[16px] bg-[#f2f2f7] hover:bg-[#e5e5ea]/80 border border-slate-300/70 focus-within:bg-white focus-within:border-[#0071e3] focus-within:ring-3 focus-within:ring-[#0071e3]/20 transition-all">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex or alex@gamura.com"
                required
                className="w-full py-3 px-3.5 pl-10.5 rounded-[16px] bg-transparent text-slate-900 font-medium text-[15px] placeholder:text-slate-400 outline-none"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Nickname (Sign Up Only) */}
          {isSignUp && (
            <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-[12px] font-semibold text-slate-700 ml-1">
                Nickname / Display Name
              </label>
              <div className="relative flex items-center rounded-[16px] bg-[#f2f2f7] hover:bg-[#e5e5ea]/80 border border-slate-300/70 focus-within:bg-white focus-within:border-[#0071e3] focus-within:ring-3 focus-within:ring-[#0071e3]/20 transition-all">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Alex Creator"
                  className="w-full py-3 px-3.5 pl-10.5 rounded-[16px] bg-transparent text-slate-900 font-medium text-[15px] placeholder:text-slate-400 outline-none"
                />
                <Sparkles className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[12px] font-semibold text-slate-700">
                Password
              </label>
              <span className="text-[11px] text-slate-500 font-medium">min 6 chars</span>
            </div>
            <div className="relative flex items-center rounded-[16px] bg-[#f2f2f7] hover:bg-[#e5e5ea]/80 border border-slate-300/70 focus-within:bg-white focus-within:border-[#0071e3] focus-within:ring-3 focus-within:ring-[#0071e3]/20 transition-all">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full py-3 px-3.5 pl-10.5 pr-10 rounded-[16px] bg-transparent text-slate-900 font-medium text-[15px] placeholder:text-slate-400 outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Apple Style Password Strength Bars */}
            {password.length > 0 && (
              <div className="flex gap-1.5 pt-1 px-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      strength >= step
                        ? strength <= 1
                          ? 'bg-rose-500'
                          : strength <= 2
                          ? 'bg-amber-400'
                          : 'bg-[#19d07f]'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Primary Submit Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[16px] bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="dots"><b /><b /><b /></span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Gamura Account' : 'Sign In with Passkey'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative px-6 py-1">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">
            <span className="bg-white px-2.5">or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button & Domain Guidance */}
        <div className="px-6 pt-1 pb-2 space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-[16px] bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[14px] flex items-center justify-center gap-2.5 border border-slate-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] cursor-pointer"
          >
            {/* Google SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Domain Authorization Guidance Banner */}
          {domainNotice && (
            <div className="p-3.5 rounded-[16px] bg-amber-50 border border-amber-200 text-left animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12.5px] font-bold text-slate-900">
                    Domain Authorization Required
                  </h4>
                  <p className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">
                    Firebase requires registering this domain in Firebase Console:
                  </p>
                  <div className="flex items-center gap-2 my-2 py-1.5 px-2.5 rounded-[10px] bg-white border border-slate-200 text-[11.5px] font-mono text-slate-800">
                    <span className="truncate flex-1 select-all">{currentHostname}</span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="text-[#0071e3] text-[11px] font-sans font-bold flex items-center gap-1 hover:opacity-80 shrink-0 cursor-pointer"
                    >
                      {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Go to <b>Firebase Console → Authentication → Settings → Authorized domains</b> and add this domain (and <code>gamura.netlify.app</code>).
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDomainNotice(false);
                        setIsSignUp(false);
                        if (!username) setUsername('gamurabrowser@gmail.com');
                      }}
                      className="text-[11.5px] font-bold text-[#0071e3] hover:underline cursor-pointer"
                    >
                      Use Email/Passkey instead →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDomainNotice(false);
                        onSkip();
                      }}
                      className="text-[11.5px] text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Skip Button - Apple Style Guest Access */}
        <div className="px-6 pt-1 pb-3 flex justify-center w-full">
          <button
            type="button"
            onClick={onSkip}
            className="w-full max-w-[340px] py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-[13px] font-semibold text-slate-700 hover:text-slate-950 active:scale-95 transition-all flex items-center justify-center gap-1.5 mx-auto shadow-xs cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#19d07f] shrink-0" />
            <span className="tracking-wide">Skip for now • Continue as Guest</span>
          </button>
        </div>

        {/* Security Footer Note */}
        <div className="bg-slate-50 border-t border-slate-100 py-2.5 px-6 text-center shrink-0">
          <p className="text-[11.5px] text-slate-500 flex items-center justify-center gap-1 font-medium">
            <Lock className="w-3 h-3 text-[#19d07f] inline" />
            <span>Secured with Firebase Auth & Real-Time Sync</span>
          </p>
        </div>
      </div>
    </div>
  );
};
