import React from 'react';
import { X, Package, Briefcase, ChevronLeft } from 'lucide-react';

interface CreationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: () => void;
  onSelectProject: () => void;
}

export const CreationSelectionModal: React.FC<CreationSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectProduct, 
  onSelectProject 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl p-8 animate-scaleIn">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
        </button>

        <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 mb-2">מה תרצה ליצור היום?</h2>
            <p className="text-slate-500 text-lg">בחר את סוג התוכן שברצונך לפרסם בפלטפורמה</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Product Option */}
            <button 
                onClick={onSelectProduct}
                className="group relative p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-right flex flex-col gap-4 overflow-hidden"
            >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package size={32} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-700 mb-1">העלאת נכס דיגיטלי</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        מכור תבניות, ערכות UI, אייקונים או כל נכס עיצובי אחר והרווח הכנסה פסיבית.
                    </p>
                </div>
                <div className="mt-auto flex items-center text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <span>המשך להעלאה</span>
                    <ChevronLeft size={16} />
                </div>
            </button>

            {/* Post Job Option */}
            <button 
                onClick={onSelectProject}
                className="group relative p-6 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-right flex flex-col gap-4 overflow-hidden"
            >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase size={32} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-emerald-700 mb-1">פרסום משרה / פרויקט</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        חפש אנשי מקצוע, מעצבים או מפתחים לפרויקט הבא שלך. פרסם מודעה בלוח הדרושים.
                    </p>
                </div>
                 <div className="mt-auto flex items-center text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <span>המשך לפרסום</span>
                    <ChevronLeft size={16} />
                </div>
            </button>
        </div>

      </div>
    </div>
  );
};