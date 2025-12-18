import React, { useState } from 'react';
import { 
  X, Check, ChevronLeft, ChevronRight, Briefcase, Building2, 
  Users, Wallet, CreditCard, Sparkles, ShieldCheck, ArrowRight,
  Upload, User, Link as LinkIcon
} from 'lucide-react';
import { CreatorProfile, Category, CreatorType } from '../types';
import { CATEGORIES } from '../constants';
import { supabase } from '../services/supabase';

interface CreatorOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onComplete: () => void;
}

const STEPS = [
  'ברוכים הבאים',
  'סוג יוצר',
  'פרופיל',
  'תחומי עניין',
  'תשלום',
  'סיום'
];

export const CreatorOnboarding: React.FC<CreatorOnboardingProps> = ({ isOpen, onClose, user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<CreatorProfile>>({
    type: 'freelancer',
    categories: [],
    displayName: user?.name || '',
    bio: '',
    portfolioUrl: '',
    payoutMethod: 'bank'
  });

  if (!isOpen) return null;

  const handleNext = async () => {
    // If we are about to move to the Success step (last step), save data first
    if (currentStep === STEPS.length - 2) {
       if (user) {
         try {
           await supabase.from('users').update({
             role: profile.type,
             bio: profile.bio,
             portfolio_url: profile.portfolioUrl,
             payout_method: profile.payoutMethod,
             // name can also be updated if desired
           }).eq('id', user.id);
         } catch (e) {
           console.error("Failed to save onboarding data", e);
         }
       }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const updateProfile = (key: keyof CreatorProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (cat: Category) => {
    const current = profile.categories || [];
    if (current.includes(cat)) {
      updateProfile('categories', current.filter(c => c !== cat));
    } else {
      updateProfile('categories', [...current, cat]);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
              <Sparkles className="w-12 h-12 text-blue-600 relative z-10" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-800">הצטרף לנבחרת היוצרים</h2>
            <p className="text-lg text-slate-500 max-w-sm leading-relaxed">
              הפוך את הכישרון שלך להכנסה פסיבית. מכור ערכות עיצוב, תבניות ואייקונים לאלפי עסקים בישראל.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
               {[
                 { icon: <Wallet className="text-emerald-500" />, title: 'הכנסה פסיבית', desc: '70% עמלה ליוצרים' },
                 { icon: <Users className="text-blue-500" />, title: 'קהל ישראלי', desc: 'חשיפה לאלפי לקוחות' },
                 { icon: <ShieldCheck className="text-purple-500" />, title: 'זכויות יוצרים', desc: 'הגנה מלאה על היצירות' }
               ].map((item, i) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                    <div className="p-2 bg-white rounded-xl shadow-sm">{item.icon}</div>
                    <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                    <span className="text-xs text-slate-500">{item.desc}</span>
                 </div>
               ))}
            </div>
          </div>
        );

      case 1: // Creator Type
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">איך אתה פועל?</h2>
              <p className="text-slate-500">בחר את סוג החשבון המתאים לך ביותר</p>
            </div>

            <div className="grid gap-4">
              {[
                { id: 'freelancer', icon: <User />, title: 'פרילנסר / עצמאי', desc: 'אני יוצר ומוכר את העבודות שלי בעצמי' },
                { id: 'studio', icon: <Briefcase />, title: 'סטודיו לעיצוב', desc: 'צוות קטן של מעצבים שיוצרים יחד' },
                { id: 'agency', icon: <Building2 />, title: 'חברה / סוכנות', desc: 'חברה בע"מ המוכרת מוצרים דיגיטליים' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateProfile('type', type.id as CreatorType)}
                  className={`w-full p-5 rounded-2xl border-2 text-right transition-all flex items-center gap-4 group ${
                    profile.type === type.id 
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' 
                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${
                    profile.type === type.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    {type.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${profile.type === type.id ? 'text-blue-900' : 'text-slate-800'}`}>
                      {type.title}
                    </h3>
                    <p className={`text-sm ${profile.type === type.id ? 'text-blue-700' : 'text-slate-500'}`}>
                      {type.desc}
                    </p>
                  </div>
                  {profile.type === type.id && <Check className="mr-auto text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 2: // Profile Details
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">הפרופיל הציבורי שלך</h2>
              <p className="text-slate-500">כך הלקוחות יראו אותך בפלטפורמה</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">שם תצוגה</label>
                 <input 
                   value={profile.displayName}
                   onChange={(e) => updateProfile('displayName', e.target.value)}
                   className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                   placeholder="השם שלך או שם המותג"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">ביוגרפיה קצרה</label>
                 <textarea 
                   value={profile.bio}
                   onChange={(e) => updateProfile('bio', e.target.value)}
                   className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium min-h-[100px] resize-none"
                   placeholder="ספר בקצרה על הנסיון שלך ומה אתה יוצר..."
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">קישור לתיק עבודות (אופציונלי)</label>
                 <div className="relative">
                   <LinkIcon className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                   <input 
                     value={profile.portfolioUrl}
                     onChange={(e) => updateProfile('portfolioUrl', e.target.value)}
                     className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                     placeholder="https://dribbble.com/yourname"
                     dir="ltr"
                   />
                 </div>
              </div>
            </div>
          </div>
        );

      case 3: // Categories
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">מה אתה יוצר?</h2>
              <p className="text-slate-500">בחר את התחומים שרלוונטיים אליך (ניתן לבחור יותר מאחד)</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.filter(c => c !== 'הכל').map((cat) => {
                const isSelected = profile.categories?.includes(cat as Category);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat as Category)}
                    className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                      isSelected
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        );
      
      case 4: // Payout
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">קבלת תשלומים</h2>
              <p className="text-slate-500">בחר איך תרצה לקבל את הכסף מהמכירות שלך</p>
            </div>

            <div className="space-y-4">
               <button
                  onClick={() => updateProfile('payoutMethod', 'bank')}
                  className={`w-full p-5 rounded-2xl border-2 text-right transition-all flex items-center gap-4 ${
                    profile.payoutMethod === 'bank'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10' 
                    : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${profile.payoutMethod === 'bank' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Building2 />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">העברה בנקאית</h3>
                    <p className="text-sm text-slate-500">תשלום ישירות לחשבון הבנק הישראלי שלך (עמלה 0%)</p>
                  </div>
                  {profile.payoutMethod === 'bank' && <Check className="mr-auto text-emerald-500" />}
               </button>

               <button
                  onClick={() => updateProfile('payoutMethod', 'paypal')}
                  className={`w-full p-5 rounded-2xl border-2 text-right transition-all flex items-center gap-4 ${
                    profile.payoutMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' 
                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${profile.payoutMethod === 'paypal' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <CreditCard />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">PayPal</h3>
                    <p className="text-sm text-slate-500">קבלת תשלום לחשבון הפייפאל שלך</p>
                  </div>
                  {profile.payoutMethod === 'paypal' && <Check className="mr-auto text-blue-500" />}
               </button>

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 flex gap-2 items-start mt-4">
                  <ShieldCheck size={16} className="text-slate-400 shrink-0" />
                  <span>
                    התשלומים מועברים בצורה מאובטחת ב-1 לכל חודש עבור מכירות החודש הקודם. נדרש סכום מינימלי של ₪200 להעברה.
                  </span>
               </div>
            </div>
          </div>
        );

      case 5: // Success
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-scaleIn">
             <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Check className="w-12 h-12 text-emerald-600 relative z-10" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-800">ברוכים הבאים לנבחרת! 🎉</h2>
            <p className="text-lg text-slate-500 max-w-sm leading-relaxed">
              הפרופיל שלך מוכן. זה הזמן להעלות את המוצר הראשון שלך ולהתחיל להרוויח.
            </p>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full mt-4">
               <h3 className="font-bold text-slate-800 mb-2">הצעדים הבאים:</h3>
               <ul className="text-right space-y-3 text-sm text-slate-600">
                 <li className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                   העלה מוצר ראשון לבדיקה
                 </li>
                 <li className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                   צוות המומחים שלנו יאשר את המוצר (עד 24 שעות)
                 </li>
                 <li className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</div>
                   התחל להרוויח מכל מכירה!
                 </li>
               </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Card */}
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slideUp">
        
        {/* Header with Progress */}
        <div className="px-8 pt-8 pb-4 bg-white z-10">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              שלב {currentStep + 1} מתוך {STEPS.length}
            </span>
            <div className="w-9"></div> {/* Spacer for center alignment */}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
               style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
             ></div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
           {renderStep()}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-50 bg-white">
          <div className="flex gap-4">
             {currentStep > 0 && currentStep < STEPS.length - 1 && (
               <button 
                 onClick={handleBack}
                 className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
               >
                 חזרה
               </button>
             )}
             
             <button 
               onClick={handleNext}
               className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                 currentStep === STEPS.length - 1
                 ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                 : 'bg-slate-900 hover:bg-black shadow-slate-900/20'
               }`}
             >
               {currentStep === 0 && 'בואו נתחיל'}
               {currentStep > 0 && currentStep < STEPS.length - 1 && 'המשך לשלב הבא'}
               {currentStep === STEPS.length - 1 && (
                 <>
                   <Upload size={18} />
                   העלה מוצר ראשון
                 </>
               )}
               {currentStep < STEPS.length - 1 && <ArrowRight size={18} className="rtl:rotate-180" />}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};