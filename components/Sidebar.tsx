import React, { useState, useEffect } from 'react';
import { 
  Compass,
  Briefcase,
  Users,
  X,
  Sparkles,
  Palette,
  Plus,
  Zap,
  PanelLeftClose,
  PanelRightClose,
  BarChart2,
  Lock,
  BookOpen,
  Layout
} from 'lucide-react';
import { Category } from '../types';

interface SidebarProps {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
  currentView: 'home' | 'projects' | 'profile' | 'creators' | 'analytics' | 'admin-hub' | 'notepad' | 'canvas';
  onSelectView: (view: 'home' | 'projects' | 'profile' | 'creators' | 'analytics' | 'admin-hub' | 'notepad' | 'canvas') => void;
  user: any;
  onLogout: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  onOpenCreatorOnboarding?: () => void;
  isProductDetailsOpen?: boolean;
  isDarkMode?: boolean;
  onOpenCreate?: () => void;
}

interface NavItemProps {
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  isExpanded: boolean;
  count?: number;
  isDarkMode?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  active, 
  onClick, 
  icon, 
  label,
  isExpanded,
  count,
  isDarkMode
}) => (
  <button
    onClick={onClick}
    title={!isExpanded ? label : ''}
    className={`
      flex items-center transition-all duration-200 ease-out group relative rounded-xl mx-auto
      ${isExpanded ? 'w-full px-3.5 py-3 gap-3 justify-start' : 'w-10 h-10 justify-center mb-2'}
      ${active 
        ? isDarkMode 
          ? 'bg-white text-black shadow-lg shadow-white/10' 
          : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
        : isDarkMode 
          ? 'text-gray-400 hover:bg-white/10 hover:text-white' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }
    `}
  >
    <span className={`relative z-10 flex-shrink-0 transition-transform ${!isExpanded && 'group-hover:scale-110'}`}>
      {icon}
    </span>
    
    <div className={`flex items-center justify-between flex-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
        <span className={`text-[14px] whitespace-nowrap ml-2 ${active ? 'font-bold' : 'font-medium'}`}>
            {label}
        </span>
        {count && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
            active 
              ? isDarkMode ? 'bg-black/10 text-black' : 'bg-white/20 text-white' 
              : isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-slate-200 text-slate-600'
          }`}>
            {count}
          </span>
        )}
    </div>

    {/* Tooltip on Left (only when collapsed) */}
    {!isExpanded && (
        <span className={`absolute right-full mr-3 px-3 py-1.5 text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl ${
            isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white'
        }`}>
          {label}
        </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeCategory, 
  onSelectCategory, 
  currentView,
  onSelectView,
  user, 
  onLogout, 
  isMobile = false, 
  onClose, 
  onOpenCreatorOnboarding,
  isProductDetailsOpen = false,
  isDarkMode = false,
  onOpenCreate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isAdmin = user?.email === 'alexivanov4425@gmail.com';
  
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(true);
    } else {
      if (currentView === 'profile' || isProductDetailsOpen || currentView === 'creators' || currentView === 'canvas') {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    }
  }, [isMobile, currentView, isProductDetailsOpen]);

  const handleCategoryClick = (cat: Category) => {
    onSelectView('home');
    onSelectCategory(cat);
    if (isMobile && onClose) onClose();
  };

  const handleProjectsClick = () => {
    onSelectView('projects');
    if (isMobile && onClose) onClose();
  }

  const handleCreatorsClick = () => {
    onSelectView('creators');
    if (isMobile && onClose) onClose();
  }

  const handleNotepadClick = () => {
    onSelectView('notepad');
    if (isMobile && onClose) onClose();
  }

  const handleCanvasClick = () => {
    onSelectView('canvas');
    if (isMobile && onClose) onClose();
  }

  const handleAdminHubClick = () => {
    onSelectView('admin-hub');
    if (isMobile && onClose) onClose();
  }

  const handleAnalyticsClick = () => {
    if (user) {
        onSelectView('analytics');
    } else {
        if (onOpenCreatorOnboarding) onOpenCreatorOnboarding();
    }
    if (isMobile && onClose) onClose();
  }

  const handleCreateClick = () => {
    if (onOpenCreate) {
        onOpenCreate();
    } else if (onOpenCreatorOnboarding) {
        onOpenCreatorOnboarding();
    }
    if (isMobile && onClose) onClose();
  }

  return (
    <div 
      className={`${isExpanded ? 'w-64' : 'w-20'} h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col shadow-sm font-sans py-6 relative z-50 ${
        isMobile ? 'w-72 rounded-l-[1.5rem]' : 'md:rounded-[1.5rem] border'
      } ${
        isDarkMode 
          ? 'bg-black/30 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/50 text-white' 
          : 'bg-white/80 backdrop-blur-xl border-white/50'
      }`}
    >
      {isMobile && onClose && (
        <button 
          onClick={onClose}
          className={`absolute top-5 left-5 p-2 rounded-full transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-white/10' 
              : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <X size={20} />
        </button>
      )}

      {/* Logo Area */}
      <div 
        onClick={() => handleCategoryClick('הכל')}
        className={`mb-6 shrink-0 flex items-center transition-all duration-300 cursor-pointer ${isExpanded ? 'px-6 gap-3' : 'justify-center'}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg shrink-0 hover:scale-105 transition-transform relative overflow-hidden group ${
            isDarkMode ? 'bg-white text-black shadow-white/20' : 'bg-slate-900 text-white shadow-slate-900/20'
        }`}>
           <Zap size={20} className={`relative z-10 transition-colors ${isDarkMode ? 'group-hover:text-red-500' : 'group-hover:text-yellow-400'}`} fill="currentColor" />
        </div>
        
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
            <h1 className={`font-black text-xl tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Yetsira</h1>
        </div>
      </div>

      {/* Main Navigation */}
      <div className={`flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar transition-all duration-300 ${isExpanded ? 'px-4' : 'px-3'}`}>
         
         <div className="flex flex-col gap-1">
           {isExpanded && <h3 className={`text-[10px] font-bold uppercase tracking-wider px-3 mb-2 mt-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>תפריט</h3>}
           <NavItem 
             active={currentView === 'home' && activeCategory === 'הכל' && !isProductDetailsOpen}
             onClick={() => handleCategoryClick('הכל')}
             icon={<Compass size={18} />}
             label="ראשי"
             isExpanded={isExpanded}
             isDarkMode={isDarkMode}
           />
           <NavItem 
             active={currentView === 'projects'}
             onClick={handleProjectsClick}
             icon={<Briefcase size={18} />}
             label="פרויקטים"
             isExpanded={isExpanded}
             count={4}
             isDarkMode={isDarkMode}
           />
           <NavItem 
             active={currentView === 'creators'}
             onClick={handleCreatorsClick}
             icon={<Palette size={18} />}
             label="האב יוצרים"
             isExpanded={isExpanded}
             isDarkMode={isDarkMode}
           />
           <NavItem 
             active={currentView === 'notepad'}
             onClick={handleNotepadClick}
             icon={<BookOpen size={18} />}
             label="המחברת"
             isExpanded={isExpanded}
             isDarkMode={isDarkMode}
           />
           <NavItem 
             active={currentView === 'canvas'}
             onClick={handleCanvasClick}
             icon={<Layout size={18} />}
             label="קנבס חופשי"
             isExpanded={isExpanded}
             isDarkMode={isDarkMode}
           />
           
           {/* Admin Only Link */}
           {isAdmin && (
             <NavItem 
               active={currentView === 'admin-hub'}
               onClick={handleAdminHubClick}
               icon={<Lock size={18} />}
               label="Admin Hub"
               isExpanded={isExpanded}
               isDarkMode={isDarkMode}
             />
           )}
         </div>

         {/* Separator */}
         <div className={`my-2 h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>

         {/* Analytics / Sales Area */}
         {user && (
           <div className="mt-1">
              <button 
                onClick={handleAnalyticsClick}
                className={`w-full relative overflow-hidden rounded-xl transition-all group border ${isExpanded ? 'p-3' : 'p-0 w-10 h-10 flex items-center justify-center mx-auto'} ${
                   currentView === 'analytics'
                   ? isDarkMode ? 'bg-white text-black border-white' : 'bg-slate-900 text-white border-slate-900'
                   : isDarkMode 
                     ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                     : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 hover:border-indigo-200'
                }`}
              >
                 {isExpanded ? (
                   <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-1.5 rounded-lg ${
                         currentView === 'analytics' 
                         ? 'bg-white/20' 
                         : isDarkMode ? 'bg-white/10' : 'bg-white shadow-sm text-indigo-500'
                      }`}>
                        <BarChart2 size={16} />
                      </div>
                      <div className="flex flex-col items-start text-right">
                         <span className={`text-[12px] font-bold ${currentView === 'analytics' ? 'text-white' : isDarkMode ? 'text-white' : 'text-slate-800'}`}>נתונים ומכירות</span>
                         <span className={`text-[10px] ${currentView === 'analytics' ? 'text-white/70' : isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>לוח בקרה</span>
                      </div>
                   </div>
                 ) : (
                   <BarChart2 size={18} className={currentView === 'analytics' ? 'text-white' : isDarkMode ? 'text-yellow-300' : 'text-indigo-500'} />
                 )}
              </button>
           </div>
         )}

      </div>

      {/* Sidebar Footer (Create Button & Collapse) */}
      <div className={`mt-auto transition-all duration-300 flex flex-col gap-4 ${isExpanded ? 'px-4' : 'px-2 items-center'}`}>
         
         {/* Create Button - Only for logged in users */}
         {user && (
            <button 
              onClick={handleCreateClick}
              className={`flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-lg active:scale-95 group overflow-hidden relative ${
                  isExpanded 
                  ? 'w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40' 
                  : 'w-10 h-10 bg-blue-600 text-white shadow-blue-500/30 rounded-2xl'
              }`}
              title="יצירה חדשה"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Plus size={isExpanded ? 20 : 20} className="relative z-10" />
                {isExpanded && <span className="relative z-10">יצירה חדשה</span>}
            </button>
         )}

         {!isMobile && (
           <button 
               onClick={() => setIsExpanded(!isExpanded)}
               className={`flex items-center justify-center rounded-xl transition-all ${
                 isDarkMode 
                   ? 'hover:bg-white/10 text-gray-500 hover:text-white' 
                   : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
               } ${isExpanded ? 'w-full py-2 gap-2' : 'w-8 h-8'}`}
           >
               {isExpanded ? (
                 <>
                   <PanelRightClose size={14} />
                   <span className="text-xs font-bold">צמצם תפריט</span>
                 </>
               ) : (
                 <PanelLeftClose size={14} />
               )}
           </button>
         )}
      </div>
    </div>
  );
};