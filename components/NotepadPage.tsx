import React from 'react';
import { BookOpen, StickyNote } from 'lucide-react';

export const NotepadPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 animate-fadeIn p-4">
        <div className="max-w-md text-center">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
                <StickyNote size={40} className="text-yellow-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">המחברת האישית</h1>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
                מקום לשמור רעיונות, סקיצות והערות לפרויקטים הבאים שלך. הפיצ'ר בפיתוח וישוחרר בקרוב.
            </p>
            <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg active:scale-95">
                הירשם לעדכונים
            </button>
        </div>
    </div>
  );
};