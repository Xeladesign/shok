import React, { useState } from 'react';
import { X, AlertCircle, ShieldCheck, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  onSignup?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google Login Error:', err);
      let msg = err.message || "התחברות נכשלה. אנא נסה שנית.";
      if (msg.includes('provider is not enabled')) {
         msg = 'שגיאת קונפיגורציה: חיבור Google אינו פעיל בשרת (Authentication -> Providers).';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: fullName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          if (onSignup) {
             onSignup({
               id: data.user?.id,
               email: data.user?.email,
               name: fullName,
               avatar: data.user?.user_metadata?.avatar_url
             });
          }
          onClose();
        } else if (data.user && !data.session) {
          setError('נשלח מייל אימות. אנא אשר את כתובת המייל שלך כדי להתחבר.');
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.session) {
           onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-row-reverse overflow-hidden font-sans animate-fadeIn text-slate-900" dir="rtl">
      
      {/* Right Side - Visuals (Branding) - Desktop Only */}
      <div className="hidden md:flex w-5/12 relative flex-col justify-between p-12 text-white overflow-hidden bg-slate-900">
           <div className="absolute inset-0 bg-blue-600">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-900 opacity-90"></div>
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           </div>
           
           <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-overlay filter blur-[120px] opacity-40"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-40"></div>

           <div className="relative z-10 mt-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold mb-6 text-blue-100">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                 הצטרף ל-5,000+ יוצרים
              </div>
              <h2 className="text-5xl font-black leading-[1.1] tracking-tight mb-6">
                הבית של<br/>
                היוצרים בישראל.
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed max-w-sm font-medium opacity-90">
                גישה מיידית לאלפי נכסים דיגיטליים, חיבור לקהילה וכלים מתקדמים לניהול העסק שלך.
              </p>
           </div>

           <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-200/60 mb-4">
                  <ShieldCheck size={14} />
                  <span>מאובטח ע"י טכנולוגיות Google ו-Supabase</span>
              </div>
           </div>
      </div>

      {/* Left Side - Login Action */}
      <div className="w-full md:w-7/12 relative flex flex-col bg-white overflow-y-auto">
          <button 
            onClick={onClose} 
            className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors z-20"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-md mx-auto p-8 flex-1 flex flex-col justify-center min-h-[600px]">
              
              <div className="mb-8 text-center">
                  <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                    {mode === 'login' ? 'ברוכים הבאים' : 'יצירת חשבון חדש'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                      {mode === 'login' ? 'התחבר כדי לגשת לחשבון שלך' : 'הצטרף לקהילה והתחל ליצור'}
                  </p>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button 
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  התחברות
                </button>
                <button 
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  הרשמה
                </button>
              </div>

              <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-3 mb-6"
              >
                 <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                 <span>המשך באמצעות Google</span>
              </button>

              <div className="relative flex py-2 items-center mb-6">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">או באמצעות אימייל</span>
                  <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-medium animate-shake text-right">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                  </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700 mr-1">שם מלא</label>
                       <div className="relative">
                          <User className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                          <input 
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                            placeholder="ישראל ישראלי"
                          />
                       </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700 mr-1">כתובת אימייל</label>
                       <div className="relative">
                          <Mail className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                          <input 
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                            placeholder="your@email.com"
                            dir="ltr"
                          />
                       </div>
                  </div>

                  <div className="space-y-1.5">
                       <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-700 mr-1">סיסמה</label>
                          {mode === 'login' && <button type="button" className="text-xs font-bold text-blue-600 hover:underline">שכחתי סיסמה?</button>}
                       </div>
                       <div className="relative">
                          <Lock className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                          <input 
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                            placeholder="••••••••"
                            dir="ltr"
                          />
                       </div>
                  </div>

                  <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                      {loading ? (
                          <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                      ) : (
                          <>
                            <span>{mode === 'login' ? 'התחבר' : 'צור חשבון'}</span>
                            <ArrowRight size={18} className="rtl:rotate-180" />
                          </>
                      )}
                  </button>
              </form>

              <p className="mt-8 text-center text-xs text-slate-400 px-4 leading-relaxed">
                  בלחיצה על {mode === 'login' ? 'התחברות' : 'הרשמה'}, אני מאשר שקראתי והסכמתי <span className="font-bold text-slate-600 hover:underline cursor-pointer">לתנאי השימוש</span> ו<span className="font-bold text-slate-600 hover:underline cursor-pointer">מדיניות הפרטיות</span>.
              </p>
          </div>
      </div>
    </div>
  );
};