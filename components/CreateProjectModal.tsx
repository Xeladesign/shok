import React, { useState } from 'react';
import { X, Briefcase, Check, DollarSign, Tag, Type, Loader2, AlignLeft, Send } from 'lucide-react';
import { supabase } from '../services/supabase';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, user, onProjectCreated }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('פרויקט');
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    // Mock API call simulation since we might not have a projects table yet
    // In a real app, this would insert into supabase 'projects' table
    setTimeout(() => {
        setLoading(false);
        onProjectCreated();
        onClose();
        setTitle('');
        setBudget('');
        setDescription('');
        setTags('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <Briefcase size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800">פרסם פרויקט חדש</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
           <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">כותרת המשרה / הפרויקט</label>
                 <div className="relative">
                    <Type className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold text-slate-800"
                      placeholder="לדוגמה: דרוש מעצב UI לאתר תדמית"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Budget */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">תקציב משוער (₪)</label>
                    <div className="relative">
                        <span className="absolute right-4 top-3.5 text-slate-400 font-bold text-lg leading-none">₪</span>
                        <input 
                          value={budget}
                          onChange={e => setBudget(e.target.value)}
                          className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold text-slate-800"
                          placeholder="5,000 - 8,000"
                        />
                    </div>
                 </div>

                 {/* Type */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">סוג משרה</label>
                    <div className="relative">
                       <select 
                          value={type}
                          onChange={e => setType(e.target.value)}
                          className="w-full pr-4 pl-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                       >
                         <option>פרויקט חד פעמי</option>
                         <option>משרה מלאה</option>
                         <option>משרה חלקית</option>
                         <option>ריטיינר</option>
                       </select>
                    </div>
                 </div>
              </div>

               {/* Description */}
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">תיאור הדרישות</label>
                 <div className="relative">
                    <AlignLeft className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                    <textarea 
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-600 min-h-[120px] resize-none"
                      placeholder="פרט את מהות הפרויקט, דרישות טכניות ולוחות זמנים..."
                    />
                 </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">תגיות (Figma, React...)</label>
                 <div className="relative">
                    <Tag className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-600"
                      placeholder="הקלד תגיות..."
                    />
                 </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                <span>{loading ? 'מפרסם...' : 'פרסם פרויקט'}</span>
              </button>

           </form>
        </div>
      </div>
    </div>
  );
};