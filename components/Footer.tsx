import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">יצ</div>
                <span className="text-xl font-black text-gray-900">יצירה.io</span>
             </div>
             <p className="text-gray-500 text-sm leading-relaxed">
               הפלטפורמה המובילה בישראל לנכסים דיגיטליים. אנחנו מחברים בין יוצרים מוכשרים לעסקים שצריכים עיצוב מעולה.
             </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">קטגוריות</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">UI Kits</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">תבניות וורדפרס</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">אייקונים</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">גופנים בעברית</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">קהילה</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">הפוך למוכר</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">בלוג היוצרים</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">פורום תמיכה</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">אירועים ומפגשים</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">הירשם לניוזלטר</h4>
            <p className="text-xs text-gray-400 mb-4">קבל עדכונים שבועיים על עיצובים חדשים ומבצעים חמים.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="המייל שלך..." className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">שלח</button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-xs text-gray-400">© 2025 Yetsira.io. כל הזכויות שמורות. תל אביב, ישראל.</p>
           <div className="flex gap-4">
             <div className="w-5 h-5 bg-gray-200 rounded-full hover:bg-blue-600 transition-colors cursor-pointer"></div>
             <div className="w-5 h-5 bg-gray-200 rounded-full hover:bg-pink-600 transition-colors cursor-pointer"></div>
             <div className="w-5 h-5 bg-gray-200 rounded-full hover:bg-blue-400 transition-colors cursor-pointer"></div>
           </div>
        </div>
      </div>
    </footer>
  );
};