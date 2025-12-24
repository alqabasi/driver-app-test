import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Wallet, LogIn, KeyRound, User, Phone, UserPlus, ShieldCheck, CloudOff, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const LoginScreen: React.FC = () => {
  const { login, register, startOfflineMode } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isOfflineSetup, setIsOfflineSetup] = useState(false);

  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const [offlineName, setOfflineName] = useState('');
  const [offlineMobile, setOfflineMobile] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  const mobileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const offlineNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOfflineSetup) {
      offlineNameRef.current?.focus();
    } else if (isRegistering) {
      nameRef.current?.focus();
    } else {
      mobileRef.current?.focus();
    }
  }, [isRegistering, isOfflineSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 5 || !password || isProcessing) return;

    setIsProcessing(true);
    try {
      if (isRegistering) {
        if (!name) return;
        const success = await register(name, mobile, password);
        if (success) {
          setIsRegistering(false);
          setPassword('');
        }
      } else {
        await login(mobile, password);
      }
    } finally {
      // Small delay to ensure the UI transition feels smooth
      setTimeout(() => setIsProcessing(false), 300);
    }
  };

  const handleOfflineBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName || !offlineMobile || isProcessing) return;

    setIsProcessing(true);
    try {
      await startOfflineMode(offlineName, offlineMobile);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-cairo" dir="rtl">

      {/* Brand Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-400/10 blur-[100px] rounded-full"></div>

      <div className="bg-white w-full max-w-md p-6 sm:p-10 rounded-[3.5rem] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500 border border-blue-50/50">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-blue-950 mb-1 tracking-tight">القبسي</h1>
          <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.3em]">
            {isOfflineSetup ? 'إعداد العمل المحلي' : 'Driver Portal v2.0'}
          </p>
        </div>

        {!isOfflineSetup ? (
          <>
            {/* Tabbed Navigation */}
            <div className="bg-blue-50/50 p-1.5 rounded-[2rem] flex mb-10 relative border border-blue-100/50">
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-blue-600 rounded-[1.6rem] shadow-lg shadow-blue-600/20 transition-all duration-500 ease-out z-0 ${isRegistering ? 'translate-x-[calc(-100%-0px)]' : 'translate-x-0'}`}
              ></div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsRegistering(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] font-black text-sm relative z-10 transition-colors duration-300 ${!isRegistering ? 'text-white' : 'text-blue-400'}`}
              >
                <LogIn size={18} />
                دخول
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsRegistering(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] font-black text-sm relative z-10 transition-colors duration-300 ${isRegistering ? 'text-white' : 'text-blue-400'}`}
              >
                <UserPlus size={18} />
                حساب جديد
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegistering && (
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black text-blue-400 mr-4 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} />
                    الاسم بالكامل
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    autoComplete="name"
                    disabled={isProcessing}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-7 py-4.5 bg-blue-50/30 text-blue-950 rounded-[1.5rem] border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none font-bold placeholder:text-blue-200 disabled:opacity-50"
                    placeholder="مثال: محمود محمد"
                    required={isRegistering}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400 mr-4 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} />
                  رقم الموبايل
                </label>
                <input
                  ref={mobileRef}
                  type="tel"
                  inputMode="tel"
                  autoComplete="username tel"
                  disabled={isProcessing}
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-7 py-4.5 bg-blue-50/30 text-blue-950 rounded-[1.5rem] border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none font-black text-right tracking-[0.2em] placeholder:text-blue-200 disabled:opacity-50"
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400 mr-4 uppercase tracking-widest flex items-center gap-2">
                  <KeyRound size={12} />
                  كلمة المرور
                </label>
                <input
                  type="password"
                  disabled={isProcessing}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-7 py-4.5 bg-blue-50/30 text-blue-950 rounded-[1.5rem] border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none font-bold placeholder:text-blue-200 disabled:opacity-50"
                  placeholder="••••••"
                  required
                />
              </div>

              <div className="pt-4 space-y-4">
                <Button
                  type="submit"
                  fullWidth
                  size="xl"
                  disabled={isProcessing}
                  className="shadow-2xl rounded-[1.8rem] py-6 text-xl font-black uppercase tracking-tight"
                >
                  {isProcessing ? (
                    <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    isRegistering ? 'بدء الحساب الآن' : 'تسجيل الدخول للعمل'
                  )}
                </Button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">أو</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <Button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsOfflineSetup(true)}
                  variant="outline"
                  fullWidth
                  size="lg"
                  className="rounded-[1.8rem] py-5 border-blue-100 text-blue-600 hover:bg-blue-50 font-black text-base transition-all"
                >
                  <CloudOff size={22} className="ml-2" />
                  دخول محلي (Offline)
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* Offline Setup Form */
          <form onSubmit={handleOfflineBypass} className="space-y-6 animate-in slide-in-from-left-4 duration-500">
            <div className="bg-blue-50 p-6 rounded-3xl mb-8 border border-blue-100">
              <p className="text-blue-700 font-bold text-sm leading-relaxed text-center">
                سيتم تخزين بياناتك محلياً على هذا الجهاز فقط. سيتم استخدام الاسم والرقم في التقارير المطبوعة.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 mr-4 uppercase tracking-widest flex items-center gap-2">
                <User size={12} />
                اسم السائق (للمعاينة)
              </label>
              <input
                ref={offlineNameRef}
                type="text"
                disabled={isProcessing}
                value={offlineName}
                onChange={e => setOfflineName(e.target.value)}
                className="w-full px-7 py-4.5 bg-blue-50/30 text-blue-950 rounded-[1.5rem] border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none font-bold placeholder:text-blue-200 disabled:opacity-50"
                placeholder="مثال: محروس القبسي"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 mr-4 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} />
                رقم الموبايل (للتقارير)
              </label>
              <input
                type="tel"
                inputMode="tel"
                disabled={isProcessing}
                value={offlineMobile}
                onChange={e => setOfflineMobile(e.target.value)}
                className="w-full px-7 py-4.5 bg-blue-50/30 text-blue-950 rounded-[1.5rem] border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none font-black text-right tracking-[0.2em] placeholder:text-blue-200 disabled:opacity-50"
                placeholder="01xxxxxxxxx"
                required
              />
            </div>

            <div className="pt-6 space-y-4">
              <Button
                type="submit"
                fullWidth
                size="xl"
                disabled={isProcessing}
                className="shadow-2xl rounded-[1.8rem] py-6 text-xl font-black bg-blue-600 text-white"
              >
                {isProcessing ? (
                  <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>ابدأ الوردية الآن</span>
                    <ArrowRight size={24} className="rotate-180" />
                  </>
                )}
              </Button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsOfflineSetup(false)}
                className="w-full text-slate-400 font-bold text-sm hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                رجوع للدخول بالإنترنت
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-[10px] font-black text-blue-100 uppercase tracking-[0.4em]">
          Alqabasi Logistics System
        </p>
      </div>
    </div>
  );
};