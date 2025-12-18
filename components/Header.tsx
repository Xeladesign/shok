import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Plus, X, Menu, Command, ShieldCheck, User, LogOut, Settings, ChevronDown, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Notification } from '../types';

interface HeaderProps {
  onOpenAISearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: any;
  onOpenLogin: () => void;
  onMenuClick?: () => void;
  onOpenCreate?: () => void;
  isDarkMode?: boolean;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onOpenChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAISearch, 
  searchQuery, 
  setSearchQuery, 
  user,
  onOpenLogin,
  onMenuClick,
  onOpenCreate,
  isDarkMode = false,
  onLogout,
  onProfileClick,
  onOpenChat
}) => {
  const isAdmin = user?.email === 'alexivanov4425@gmail.com';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Notifications on load
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
        }, (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async () => {
    if (unreadCount > 0) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const toggleNotifications = () => {
    if (!isNotifOpen) {
      markAsRead();
    }
    setIsNotifOpen(!isNotifOpen);
    setIsUserMenuOpen(false);
  };

  return (
    <header className={`h-16 md:h-20 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20 gap-4 backdrop-blur-xl rounded-[1.2rem] md:rounded-[1.5rem] border shadow-sm mx-1 transition-all duration-500 ${
        isDarkMode 
        ? 'bg-black/30 border-white/5 text-white' 
        : 'bg-white/70 border-white/60 text-slate-800'
    }`}>
      
      {/* Right Side: Search & Menu */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className={`md:hidden p-2.5 border rounded-xl transition-all shadow-sm active:scale-95 ${
                isDarkMode 
                ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' 
                : 'bg-white border-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <Menu size={20} />
          </button>

          <div className="relative group w-full flex-1">
             <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 flex items-center gap-2">
                <Search className={`w-4 h-4 transition-colors ${
                    isDarkMode ? 'text-gray-400 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-blue-500'
                }`} />
             </div>
             
             <input 
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="חפש נכסים, תבניות או יוצרים..."
               dir="rtl"
               className={`w-full border rounded-2xl py-2.5 md:py-3 pr-10 pl-12 text-sm font-medium transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] ${
                   isDarkMode 
                   ? 'bg-white/5 hover:bg-white/10 focus:bg-black/80 border-transparent hover:border-white/10 focus:border-white/30 text-white placeholder-gray-500 focus:ring-4 focus:ring-white/5' 
                   : 'bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-blue-500/50 text-slate-800 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400'
               }`}
             />

             <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
               {searchQuery ? (
                 <button 
                   onClick={() => setSearchQuery('')}
                   className={`p-1 rounded-full transition-colors ${
                       isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                   }`}
                 >
                   <X size={14} />
                 </button>
               ) : (
                 <div className={`hidden md:flex items-center gap-1 border px-1.5 py-0.5 rounded-md shadow-sm ${
                     isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                 }`}>
                   <Command size={10} className={isDarkMode ? 'text-gray-500' : 'text-slate-400'} />
                   <span className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>K</span>
                 </div>
               )}
             </div>
          </div>

          <button 
           onClick={onOpenAISearch}
           className={`h-10 w-10 md:h-11 md:w-11 flex items-center justify-center border rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 group shrink-0 relative overflow-hidden ${
               isDarkMode 
               ? 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10 hover:shadow-blue-500/10' 
               : 'bg-gradient-to-br from-white to-blue-50 border-blue-100 text-blue-600 hover:shadow-blue-500/10'
           }`}
           title="חיפוש חכם ב-AI"
         >
           <div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/10'}`}></div>
           <Sparkles className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
         </button>
      </div>

      {/* Left Side: Actions */}
      <div className="flex items-center justify-end gap-3 w-auto shrink-0">
         
         {isAdmin && (
           <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow-md border border-slate-700">
             <ShieldCheck size={14} className="text-emerald-400" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
           </div>
         )}

         {/* Messages & Notifications */}
         {user && (
            <div className="flex items-center gap-2">
                <button 
                  onClick={onOpenChat}
                  className={`h-10 w-10 md:h-11 md:w-11 flex items-center justify-center border rounded-xl transition-all relative group shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                    isDarkMode 
                    ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10' 
                    : 'bg-white border-slate-100 text-slate-400 hover:text-blue-600'
                }`}>
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                <div className="relative">
                    <button 
                      onClick={toggleNotifications}
                      className={`h-10 w-10 md:h-11 md:w-11 flex items-center justify-center border rounded-xl transition-all relative group shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                        isDarkMode 
                        ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10' 
                        : 'bg-white border-slate-100 text-slate-400 hover:text-slate-800'
                    }`}>
                      <Bell className="w-5 h-5 group-hover:animate-swing" />
                      {unreadCount > 0 && (
                        <span className="absolute top-3 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fadeIn z-50">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">התראות</h3>
                            {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} חדשות</span>}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-sm">אין התראות חדשות</div>
                            ) : (
                              notifications.map(notif => (
                                  <div key={notif.id} className={`p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}>
                                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                          {notif.actor_avatar && <img src={notif.actor_avatar} className="w-full h-full object-cover" />}
                                      </div>
                                      <div className="text-sm">
                                          <span className="font-bold text-slate-900">{notif.actor_name}</span>
                                          <span className="text-slate-600 mx-1">
                                            {notif.type === 'comment' && 'הגיב על המוצר שלך:'}
                                            {notif.type === 'follow' && 'התחיל לעקוב אחריך'}
                                            {notif.type === 'message' && 'שלח לך הודעה'}
                                          </span>
                                          {notif.content && <div className="text-slate-500 text-xs mt-1 bg-slate-50 p-1.5 rounded line-clamp-2">"{notif.content}"</div>}
                                          <div className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleDateString('he-IL')}</div>
                                      </div>
                                  </div>
                              ))
                            )}
                        </div>
                      </div>
                    )}
                </div>
            </div>
         )}

         {/* Divider */}
         <div className={`w-px h-8 hidden md:block ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

         {/* User Profile / Login */}
         {user ? (
            <div className="relative">
                <button 
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotifOpen(false); }}
                  className={`flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-xl border transition-all ${
                      isDarkMode 
                      ? 'border-white/10 hover:bg-white/5 hover:border-white/20' 
                      : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200 bg-white'
                  }`}
                >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200">
                        {user.avatar 
                            ? <img src={user.avatar} className="w-full h-full object-cover" alt="User" /> 
                            : <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold">{user.name?.[0]}</div>}
                    </div>
                    <div className="hidden md:block text-right">
                        <div className={`text-sm font-bold leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
                    </div>
                    <ChevronDown size={14} className={`hidden md:block ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fadeIn z-50 p-1">
                        <button 
                          onClick={() => { onProfileClick && onProfileClick(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-right"
                        >
                            <User size={16} />
                            <span>הפרופיל שלי</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-right">
                            <Settings size={16} />
                            <span>הגדרות</span>
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button 
                          onClick={() => { onLogout && onLogout(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-right"
                        >
                            <LogOut size={16} />
                            <span>התנתק</span>
                        </button>
                    </div>
                )}
            </div>
         ) : (
             <button 
                onClick={onOpenLogin}
                className={`h-10 px-5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg active:scale-95 flex items-center gap-2 ${
                    isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-200 shadow-white/10' 
                    : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'
                }`}
             >
                <User size={18} />
                <span>התחברות</span>
             </button>
         )}

      </div>
    </header>
  );
};