import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Message, ChatUser } from '../types';
import { Send, Loader2, MessageCircle, Search, MoreVertical, Phone, Video, ChevronRight, Check, CheckCheck, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';

interface ChatPageProps {
  currentUser: any;
  recipientUser?: any;
}

export const ChatPage: React.FC<ChatPageProps> = ({ currentUser, recipientUser }) => {
  // --- State ---
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Loading States
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---

  // 1. Initialize with specific recipient if passed via props
  useEffect(() => {
    if (recipientUser && currentUser) {
      const user: ChatUser = {
        id: recipientUser.id,
        name: recipientUser.name,
        avatar: recipientUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientUser.name)}`
      };
      
      setActiveChatUser(user);
      
      // Optimistically add to list
      setChatUsers(prev => {
        if (prev.some(u => u.id === user.id)) return prev;
        return [user, ...prev];
      });
    }
  }, [recipientUser, currentUser]);

  // 2. Fetch Chat List (Sidebar)
  useEffect(() => {
    if (currentUser) {
      fetchChatUsers();
    }
  }, [currentUser]);

  // 3. Fetch Messages & Subscribe
  useEffect(() => {
    let subscription: any = null;

    if (activeChatUser && currentUser) {
      fetchMessages(activeChatUser.id);
      
      const channel = supabase
        .channel(`chat:${currentUser.id}:${activeChatUser.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}` 
        }, (payload) => {
           const newMsg = payload.new as Message;
           if (newMsg && newMsg.sender_id === activeChatUser.id) {
             setMessages(prev => [...prev, newMsg]);
             markAsRead([newMsg.id]);
             scrollToBottom();
           }
        })
        .subscribe();

      subscription = channel;
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [activeChatUser, currentUser]);

  // 4. Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Logic ---

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const fetchChatUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: sent } = await supabase.from('messages').select('receiver_id, content, created_at').eq('sender_id', currentUser.id).order('created_at', { ascending: false });
      const { data: received } = await supabase.from('messages').select('sender_id, content, created_at, is_read').eq('receiver_id', currentUser.id).order('created_at', { ascending: false });

      const safeSent = sent || [];
      const safeReceived = received || [];

      const userMap = new Map<string, { lastMsg: string, time: string, unread: number }>();

      safeSent.forEach(m => {
          if (!userMap.has(m.receiver_id)) {
              userMap.set(m.receiver_id, { lastMsg: m.content, time: m.created_at, unread: 0 });
          }
      });

      safeReceived.forEach(m => {
          const existing = userMap.get(m.sender_id);
          const isNewer = existing ? new Date(m.created_at) > new Date(existing.time) : true;
          
          if (!existing || isNewer) {
              userMap.set(m.sender_id, { 
                  lastMsg: m.content, 
                  time: m.created_at, 
                  unread: (existing?.unread || 0) + (m.is_read ? 0 : 1)
              });
          } else if (existing && !m.is_read) {
              existing.unread += 1;
          }
      });

      const userIds = Array.from(userMap.keys());

      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name, avatar_url').in('id', userIds);
        
        if (users) {
            const formattedUsers: ChatUser[] = users.map(u => {
                const info = userMap.get(u.id);
                return {
                    id: u.id,
                    name: u.name || 'Unknown',
                    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}`,
                    lastMessage: info?.lastMsg,
                    lastMessageTime: info?.time,
                    unreadCount: info?.unread
                };
            });
            formattedUsers.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
            setChatUsers(formattedUsers);
        }
      } else {
        setChatUsers([]);
      }
    } catch (e) {
      console.error("Error loading chat list:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    setIsLoadingMessages(true);
    setMessages([]);
    try {
        const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

        if (error) throw error;

        const msgs = data as Message[] || [];
        setMessages(msgs);

        const unreadIds = msgs
            .filter(m => m.receiver_id === currentUser.id && !m.is_read)
            .map(m => m.id);
        
        if (unreadIds.length > 0) {
            markAsRead(unreadIds);
        }

    } catch (e) {
        console.error("Error loading messages:", e);
    } finally {
        setIsLoadingMessages(false);
        scrollToBottom();
    }
  };

  const markAsRead = async (ids: number[]) => {
      if (ids.length === 0) return;
      try {
          await supabase.from('messages').update({ is_read: true }).in('id', ids);
          setChatUsers(prev => prev.map(u => {
             if (u.id === activeChatUser?.id) return { ...u, unreadCount: 0 };
             return u;
          }));
      } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChatUser || isSending) return;

    const content = inputText.trim();
    setInputText(''); 
    setIsSending(true);

    try {
        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            receiver_id: activeChatUser.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false
        }).select().single();

        if (error) throw error;

        if (data) {
            setMessages(prev => [...prev, data]);
            setChatUsers(prev => {
                const otherUsers = prev.filter(u => u.id !== activeChatUser.id);
                return [{
                    ...activeChatUser,
                    lastMessage: content,
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0
                }, ...otherUsers];
            });

            await supabase.from('notifications').insert({
                user_id: activeChatUser.id,
                actor_id: currentUser.id,
                actor_name: currentUser.name,
                actor_avatar: currentUser.avatar,
                type: 'message',
                content: content.substring(0, 50),
                is_read: false
            });
        }
    } catch (e) {
        console.error("Send failed:", e);
        setInputText(content);
        alert("שגיאה בשליחת ההודעה");
    } finally {
        setIsSending(false);
        scrollToBottom();
    }
  };

  const handleMobileBack = () => {
    setActiveChatUser(null);
  };

  const formatTime = (dateStr: string) => {
      try { return new Date(dateStr).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}); } catch { return ''; }
  };

  const getDateGroupLabel = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'היום';
        if (date.toDateString() === yesterday.toDateString()) return 'אתמול';
        return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
      } catch { return ''; }
  };

  return (
    // Changed to absolute inset-0 to force the container to strictly fit the parent relative container
    // This prevents flexbox overflow issues on desktop
    <div className="absolute inset-0 flex w-full h-full bg-white overflow-hidden font-sans isolate">
        
        {/* --- LEFT: Sidebar / Users List --- */}
        <div className={`
            flex-col h-full w-full md:w-[360px] relative z-10 bg-slate-50/50 border-l border-slate-100
            ${activeChatUser ? 'hidden md:flex' : 'flex'}
        `}>
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">הודעות</h2>
                    <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-blue-500/30">
                        {chatUsers.reduce((acc, u) => acc + (u.unreadCount || 0), 0)}
                    </div>
                </div>
                
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute right-4 top-3.5 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <input 
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                      placeholder="חפש שיחה..."
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1 mt-2 min-h-0">
                {isLoadingUsers ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : chatUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                           <MessageCircle size={28} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-600">אין הודעות</p>
                        <p className="text-xs text-slate-400 max-w-[150px] mt-1">השיחות שלך יופיעו כאן</p>
                    </div>
                ) : (
                    chatUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => setActiveChatUser(user)}
                          className={`w-full p-3 flex items-center gap-3.5 rounded-2xl transition-all relative text-right group ${
                              activeChatUser?.id === user.id
                              ? 'bg-white shadow-lg shadow-blue-900/5 ring-1 ring-blue-50 z-10'
                              : 'hover:bg-white/60 hover:shadow-sm'
                          }`}
                        >
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white rounded-full"></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className={`font-bold text-sm truncate ${activeChatUser?.id === user.id ? 'text-blue-600' : 'text-slate-900'}`}>
                                        {user.name}
                                    </span>
                                    {user.lastMessageTime && (
                                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-1">
                                            {formatTime(user.lastMessageTime)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className={`text-xs truncate max-w-[160px] ${activeChatUser?.id === user.id ? 'text-slate-600 font-medium' : 'text-slate-500 opacity-80'}`}>
                                        {user.lastMessage || 'התחל שיחה חדשה...'}
                                    </span>
                                    {(user.unreadCount || 0) > 0 && (
                                        <span className="min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm shadow-blue-500/30 animate-pulse">
                                            {user.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* --- RIGHT: Chat Area --- */}
        <div className={`
           flex-col h-full flex-1 w-full relative bg-white
           ${activeChatUser ? 'flex' : 'hidden md:flex'}
        `}>
            {activeChatUser ? (
                <>
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-xl sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={handleMobileBack}
                                className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>

                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                        <img src={activeChatUser.avatar} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                                        {activeChatUser.name}
                                    </h3>
                                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                        מחובר
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="שיחה קולית">
                                <Phone size={20} />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="שיחת וידאו">
                                <Video size={20} />
                            </button>
                            <div className="w-px h-6 bg-slate-100 mx-2"></div>
                            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages List - Added min-h-0 to prevent flex overflow issues */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth min-h-0" ref={messagesContainerRef}>
                        {isLoadingMessages && (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
                        )}

                        {!isLoadingMessages && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full pb-20 opacity-60 animate-fadeIn">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                    <MessageCircle size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-700 mb-1">תחילת השיחה</h3>
                                <p className="text-sm text-slate-400">שלח הודעה ל{activeChatUser.name} כדי להתחיל</p>
                            </div>
                        )}

                        {(messages || []).map((msg, index) => {
                             const isMe = msg.sender_id === currentUser.id;
                             const prevMsg = messages[index - 1];
                             const showDate = !prevMsg || getDateGroupLabel(msg.created_at) !== getDateGroupLabel(prevMsg.created_at);

                             return (
                                 <React.Fragment key={msg.id || index}>
                                     {showDate && (
                                         <div className="flex justify-center my-8 sticky top-0 z-20">
                                             <span className="bg-white/80 backdrop-blur-md border border-slate-200/60 px-4 py-1.5 rounded-full text-[11px] font-bold text-slate-500 shadow-sm">
                                                 {getDateGroupLabel(msg.created_at)}
                                             </span>
                                         </div>
                                     )}

                                     <div className={`flex ${isMe ? 'justify-start' : 'justify-end'} group animate-fadeIn`}>
                                         <div className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} max-w-[75%] md:max-w-[65%]`}>
                                             <div 
                                                className={`px-5 py-3.5 text-[15px] shadow-sm relative transition-all leading-relaxed ${
                                                isMe 
                                                ? 'bg-blue-600 text-white rounded-[1.25rem] rounded-tr-sm shadow-blue-500/20' 
                                                : 'bg-white border border-slate-100 text-slate-800 rounded-[1.25rem] rounded-tl-sm hover:shadow-md'
                                             }`}>
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                             </div>
                                             
                                             <div className={`flex items-center gap-1.5 text-[11px] mt-1.5 px-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                                 <span className="text-slate-400">{formatTime(msg.created_at)}</span>
                                                 {isMe && (
                                                     msg.is_read 
                                                     ? <CheckCheck size={14} className="text-blue-500" /> 
                                                     : <Check size={14} className="text-slate-300" />
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 </React.Fragment>
                             );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/90 backdrop-blur-xl border-t border-slate-50">
                        <form onSubmit={handleSendMessage} className="relative">
                            <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 transition-all focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white shadow-sm">
                                
                                <div className="flex gap-1 pb-1 pr-1">
                                    <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                        <Paperclip size={20} />
                                    </button>
                                    <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors hidden md:block">
                                        <ImageIcon size={20} />
                                    </button>
                                </div>

                                <textarea 
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="כתוב הודעה..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-2 py-3 font-medium text-slate-800 max-h-[120px] resize-none custom-scrollbar text-base"
                                    rows={1}
                                    style={{ minHeight: '48px' }}
                                />
                                
                                <div className="pb-1 pl-1">
                                    <button 
                                        type="submit" 
                                        disabled={!inputText.trim() || isSending}
                                        className="w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-lg shadow-blue-500/20 active:scale-90 flex items-center justify-center shrink-0"
                                    >
                                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="rtl:rotate-180 ml-0.5" />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                /* Empty Placeholder State (Desktop) */
                <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                    <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border border-slate-100 rotate-3 transition-transform hover:rotate-0 relative z-10">
                        <MessageCircle size={48} className="text-blue-500" />
                    </div>
                    <h3 className="font-black text-3xl text-slate-800 mb-3 tracking-tight relative z-10">הצ'אט שלך</h3>
                    <p className="font-medium text-slate-500 max-w-xs leading-relaxed relative z-10">
                        בחר שיחה מהרשימה כדי להתכתב, או חפש משתמש חדש כדי להתחיל.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};