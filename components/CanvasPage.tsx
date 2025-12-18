import React from 'react';
import { Layout, PenTool } from 'lucide-react';

export const CanvasPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#141414] text-white animate-fadeIn p-4">
        <div className="max-w-md text-center">
            <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10 backdrop-blur-md">
                <PenTool size={40} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">קנבס חופשי</h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
                לוח עבודה אינסופי לסיעור מוחות, יצירת Moodboards ושיתוף פעולה בזמן אמת.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 active:scale-95">
                בקש גישה מוקדמת
            </button>
        </div>
    </div>
  );
};