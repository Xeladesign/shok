import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, Search } from 'lucide-react';
import { getSmartSuggestions } from '../services/geminiService';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySearch: (term: string) => void;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({ isOpen, onClose, onApplySearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ suggestions: string[], message: string } | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await getSmartSuggestions(query);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

        {/* Header */}
        <div className="p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex justify-between items-center relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
               <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-800">AI Assistant</h2>
              <p className="text-slate-500 text-sm font-medium">מה אנחנו מחפשים היום?</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex-1 overflow-y-auto">
          {!result && !loading && (
            <div className="text-center py-12 text-slate-400">
               <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                 <Sparkles className="w-12 h-12 text-blue-300" />
               </div>
               <p className="text-xl text-slate-800 font-bold">התחל כאן</p>
               <p className="text-sm mt-2 opacity-70 font-medium">"חפש לי תבניות לאתר איקומרס נקי"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                 <div className="w-14 h-14 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                 </div>
              </div>
              <p className="mt-4 text-blue-600 animate-pulse font-bold text-sm">מעבד בקשה...</p>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-fadeIn">
               <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                 <p className="text-slate-800 text-lg font-medium leading-relaxed">🤖 {result.message}</p>
               </div>
               
               <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">הצעות חיפוש</h3>
                 <div className="grid gap-3">
                   {result.suggestions.map((suggestion, idx) => (
                     <button 
                       key={idx}
                       onClick={() => {
                         onApplySearch(suggestion);
                         onClose();
                       }}
                       className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 hover:border-blue-300 border border-slate-200 rounded-2xl transition-all shadow-sm hover:shadow-md group text-right"
                     >
                       <span className="font-bold text-slate-700 group-hover:text-blue-600 text-lg transition-colors">{suggestion}</span>
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-white shadow-sm group-hover:bg-blue-500 transition-all">
                         <Search className="w-5 h-5" />
                       </div>
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer Input */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="relative">
             <input
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               placeholder="תאר את הפרויקט..."
               className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-800 placeholder-slate-400 text-lg font-medium"
               autoFocus
             />
             <button 
               onClick={handleSearch}
               disabled={!query.trim() || loading}
               className="absolute left-2.5 top-2.5 bottom-2.5 aspect-square bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:scale-95 active:scale-90 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20"
             >
               <Send className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};