import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Message, ChatUser } from '../types';
import { Send, Loader2, MessageCircle, Search, X, ChevronRight, Check, CheckCheck, Paperclip, Minimize2, Image as ImageIcon } from 'lucide-react';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  recipientUser?: any; // If passed, opens this chat immediately
}

export const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, currentUser, recipientUser }) => {
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Handle External Recipient (Opening chat from profile/product)
  useEffect(() => {
    if (recipientUser && currentUser) {
      const user: ChatUser = {
        id: recipientUser.id,
        name: recipientUser.name,
        avatar: recipientUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientUser.name)}`
      };
      
      // Check if already in list, if not add optimistically
      setChatUsers(prev => {
        if (prev.some(u => u.id === user.id)) return prev;
        return [user, ...prev];
      });
      
      setActiveChatUser(user);
    }
  }, [recipientUser, currentUser]);

  // 2. Load Inbox List when open
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchChatUsers();
    }
  }, [isOpen, currentUser]);

  // 3. Load Messages when specific chat active
  useEffect(() => {
    let subscription: any = null;

    if (activeChatUser && currentUser && isOpen) {
      fetchMessages(activeChatUser.id);
      
      // Subscribe to new messages
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
  }, [activeChatUser, currentUser, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          if (!userMap.has(m.receiver_id)) userMap.set(m.receiver_id, { lastMsg: m.content, time: m.created_at, unread: 0 });
      });

      safeReceived.forEach(m => {
          const existing = userMap.get(m.sender_id);
          const isNewer = existing ? new Date(m.created_at) > new Date(existing.time) : true;
          if (!existing || isNewer) {
              userMap.set(m.sender_id, { lastMsg: m.content, time: m.created_at, unread: (existing?.unread || 0) + (m.is_read ? 0 : 1) });
          } else if (existing && !m.is_read) {
              existing.unread += 1;
          }
      });

      const userIds = Array.from(userMap.keys());
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name, avatar_url').in('id', userIds);
        if (users) {
            const formattedUsers = users.map(u => {
                const info = userMap.get(u.id);
                return {
                    id: u.id,
                    name: u.name || 'Unknown',
                    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}`,
                    lastMessage: info?.lastMsg,
                    lastMessageTime: info?.time,
                    unreadCount: info?.unread
                };
            }).sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
            setChatUsers(formattedUsers);
        }
      }
    } catch (e) { console.error(e); } 
    finally { setIsLoadingUsers(false); }
  };

  const fetchMessages = async (partnerId: string) => {
    setIsLoadingMessages(true);
    try {
        const { data } = await supabase.from('messages').select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

        if (data) {
            setMessages(data as Message[]);
            const unreadIds = data.filter(m => m.receiver_id === currentUser.id && !m.is_read).map(m => m.id);
            if (unreadIds.length > 0) markAsRead(unreadIds);
        }
    } catch (e) { console.error(e); } 
    finally { setIsLoadingMessages(false); scrollToBottom(); }
  };

  const markAsRead = async (ids: number[]) => {
      if (ids.length === 0) return;
      await supabase.from('messages').update({ is_read: true }).in('id', ids);
      setChatUsers(prev => prev.map(u => u.id === activeChatUser?.id ? { ...u, unreadCount: 0 } : u));
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
            // Update List Preview
            setChatUsers(prev => {
                const others = prev.filter(u => u.id !== activeChatUser.id);
                return [{ ...activeChatUser, lastMessage: content, lastMessageTime: new Date().toISOString(), unreadCount: 0 }, ...others];
            });
            // Notification
            await supabase.from('notifications').insert({
                user_id: activeChatUser.id,
                actor_id: currentUser.id,
                actor_name: currentUser.name,
                actor_avatar: currentUser.avatar,
                type: 'message',
                content: content.substring(0, 50)
            });
        }
    } catch (e) { 
        setInputText(content); 
        console.error(e); 
    } finally { 
        setIsSending(false); 
        scrollToBottom(); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col items-end" dir="rtl">
        <div className={`
            bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ease-out flex flex-col origin-bottom-left
            w-[90vw] md:w-[380px] h-[600px] max-h-[80vh]
        `}>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                    {activeChatUser ? (
                        <>
                            <button onClick={() => setActiveChatUser(null)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                                <ChevronRight size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden border border-white/20">
                                    <img src={activeChatUser.avatar} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-sm">{activeChatUser.name}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                                <MessageCircle size={18} fill="currentColor" />
                            </div>
                            <span className="font-black text-lg tracking-tight">הודעות</span>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                    <Minimize2 size={18} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-50 flex flex-col">
                
                {activeChatUser ? (
                    /* Conversation View */
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 min-h-0">
                            {isLoadingMessages && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-400" /></div>}
                            
                            {!isLoadingMessages && messages.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                        <Send className="text-blue-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">שלח הודעה ראשונה</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === currentUser.id;
                                return (
                                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group ${
                                            isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                        }`}>
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                            <div className={`text-[10px] mt-1 flex items-center gap-1 opacity-70 ${isMe ? 'justify-start' : 'justify-end'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                                                {isMe && (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-3xl border border-slate-200 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                                <div className="flex gap-1 pb-1 pr-1">
                                    <button type="button" className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                                        <Paperclip size={18} />
                                    </button>
                                </div>
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="כתוב הודעה..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none py-2.5 px-1 max-h-24 resize-none text-sm font-medium"
                                    rows={1}
                                />
                                <button disabled={!inputText.trim() || isSending} type="submit" className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-md active:scale-90">
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:rotate-180" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    /* Inbox List View */
                    <>
                        <div className="p-4 pb-2 bg-white">
                            <div className="relative">
                                <Search className="absolute right-3.5 top-2.5 text-slate-400 w-4 h-4" />
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-400 transition-all" placeholder="חפש שיחה..." />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {isLoadingUsers ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : chatUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50 pb-10">
                                    <MessageCircle size={40} className="text-slate-300 mb-2" />
                                    <p className="text-sm font-bold text-slate-500">אין הודעות עדיין</p>
                                </div>
                            ) : (
                                chatUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setActiveChatUser(user)}
                                        className="w-full p-3 flex items-center gap-3 rounded-2xl hover:bg-white transition-all text-right group border border-transparent hover:border-slate-100 hover:shadow-sm"
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                                                <img src={user.avatar} className="w-full h-full object-cover" />
                                            </div>
                                            {user.unreadCount! > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-bold text-sm text-slate-800 truncate">{user.name}</span>
                                                <span className="text-[10px] text-slate-400">{user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleDateString('he-IL', {day:'numeric', month:'short'}) : ''}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs truncate max-w-[180px] ${user.unreadCount! > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                                    {user.lastMessage || 'התחל שיחה...'}
                                                </span>
                                                {user.unreadCount! > 0 && (
                                                    <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 rounded-md">{user.unreadCount}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};