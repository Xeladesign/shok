import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Product, Comment } from '../types';
import { 
  ArrowRight, ShoppingCart, Share2, Heart, ShieldCheck, 
  Zap, Download, Lock, Check, Layers, Monitor, 
  FileCode, Calendar, Globe, AlertCircle, ChevronLeft, ChevronRight, Eye, MapPin, Send, Loader2, User, Star, Mail, UserPlus, UserCheck, MessageCircle
} from 'lucide-react';
import gsap from 'gsap';
import { supabase } from '../services/supabase';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAuthorClick?: (authorName: string) => void;
  user?: any;
  onOpenLogin?: () => void;
  onOpenChat?: (recipient?: any) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  product, 
  onBack, 
  onAuthorClick,
  user,
  onOpenLogin,
  onOpenChat
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLicense, setSelectedLicense] = useState<'regular' | 'extended'>('regular');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'support'>('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // Author Info State (for follow/chat)
  const [authorUser, setAuthorUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Use product gallery if available, otherwise fallback to repeating the main image
  const galleryImages = product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [product.image, product.image, product.image];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power3.out'
      });
      
      gsap.from(".sidebar-item", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.2
      });
    }, containerRef);

    return () => ctx.revert();
  }, [product]);

  useEffect(() => {
    fetchComments();
    incrementViews();
    fetchAuthorDetails();
  }, [product.id]);

  const incrementViews = async () => {
    try {
        const { data } = await supabase.from('products').select('views').eq('id', product.id).single();
        const currentViews = data?.views || 0;
        await supabase.from('products').update({ views: currentViews + 1 }).eq('id', product.id);
    } catch (e) {
        console.error("Failed to increment views", e);
    }
  };

  const fetchAuthorDetails = async () => {
      // Find author user ID by name (Product table only has name)
      // Ideally product should have author_id, but we work with existing schema
      const { data: userData } = await supabase.from('users').select('*').eq('name', product.author).single();
      if (userData) {
          setAuthorUser(userData);
          if (user) {
             const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', userData.id).single();
             if (followData) setIsFollowing(true);
          }
      }
  };

  const fetchComments = async () => {
    if (comments.length === 0) setLoadingComments(true);
    try {
      const { data } = await supabase.from('comments').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
      if (data) setComments(data as Comment[]);
    } catch (error) {
      console.error("Error fetching comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!user) { if (onOpenLogin) onOpenLogin(); return; }
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const { error } = await supabase.from('comments').insert([{
          product_id: product.id,
          user_id: user.id,
          user_name: user.name,
          user_avatar: user.avatar,
          content: newComment
        }]);

      if (error) throw error;
      setNewComment('');
      fetchComments(); 
    } catch (error) {
      console.error("Error posting comment", error);
      alert("שגיאה בפרסום התגובה.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDownload = () => {
    if (!user) { if (onOpenLogin) onOpenLogin(); return; }
    if (product.file_url) {
      const downloadLink = document.createElement('a');
      downloadLink.href = `${product.file_url}?download=`;
      downloadLink.setAttribute('download', product.title || 'download');
      downloadLink.setAttribute('target', '_blank'); 
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      alert("קובץ לא זמין להורדה (נא להעלות קובץ בעריכה/יצירה).");
    }
  };

  const handleAction = () => {
    if (product.price === 0) {
       handleDownload();
    } else {
      alert(`מעבר לתשלום (${selectedLicense === 'regular' ? 'רשיון רגיל' : 'רשיון מורחב'})... (Mock)`);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) { if(onOpenLogin) onOpenLogin(); return; }
      if (!authorUser) return;

      if (isFollowing) {
         await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', authorUser.id);
         setIsFollowing(false);
      } else {
         await supabase.from('follows').insert({ follower_id: user.id, following_id: authorUser.id });
         // Notify
          await supabase.from('notifications').insert({
              user_id: authorUser.id,
              actor_id: user.id,
              actor_name: user.name,
              actor_avatar: user.avatar,
              type: 'follow'
          });
         setIsFollowing(true);
      }
  };

  const isFree = product.price === 0;

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#F8FAFC] overflow-y-auto custom-scrollbar relative font-sans">
      
      {/* 1. Header (Navigation) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
           <div className="flex items-center gap-4">
              
              <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 transition-colors">
                <ArrowRight size={16} />
                חזרה
              </button>

              <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                 <button onClick={onBack} className="hover:text-blue-600 transition-colors">בית</button>
                 <ChevronLeft size={14} />
                 <span>{product.category}</span>
                 <ChevronLeft size={14} />
                 <span className="text-slate-400 truncate max-w-[200px]">{product.title}</span>
              </div>
              
           </div>
        </div>
      </div>

      {/* 2. Main Layout - Gallery on Right, Sidebar on Left */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 w-full flex flex-col lg:flex-row gap-8 items-start">
         
         {/* COLUMN 1: Gallery & Content (Right side in RTL) */}
         <div className="flex-1 w-full min-w-0 order-1 lg:order-1">
            
            {/* Gallery Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 mb-8">
               <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 group">
                  <img 
                    src={galleryImages[currentImageIndex]} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
               </div>
               
               {/* Thumbnails */}
               <div className="flex gap-3 mt-3 overflow-x-auto no-scrollbar pb-1 px-1">
                  {galleryImages.map((img, idx) => (
                     <button 
                       key={idx}
                       onClick={() => setCurrentImageIndex(idx)}
                       className={`relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${currentImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                     >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                     </button>
                  ))}
               </div>
            </div>

            {/* Description & Tabs */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto no-scrollbar">
                    {['details', 'comments', 'support'].map((t) => (
                       <button 
                         key={t}
                         onClick={() => setActiveTab(t as any)}
                         className={`px-8 py-5 font-bold text-sm border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === t ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                       >
                          {t === 'details' ? 'פרטי המוצר' : t === 'comments' ? `תגובות (${comments.length})` : 'תמיכה'}
                       </button>
                    ))}
                </div>

                <div className="p-8 md:p-10">
                   {activeTab === 'details' && (
                     <div className="space-y-10 animate-fadeIn">
                        <div>
                           <h3 className="text-2xl font-black text-slate-900 mb-4">תיאור המוצר</h3>
                           <div className="text-slate-600 leading-loose text-lg whitespace-pre-wrap">
                              {product.description ? <p>{product.description}</p> : <p className="mb-4"><strong>{product.title}</strong> הוא הפתרון המושלם לפרויקט הבא שלכם.</p>}
                           </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                              <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                                <Zap className="text-blue-500" size={24} />
                                פיצ'רים מרכזיים
                              </h4>
                              <ul className="space-y-4">
                                 {product.features?.length ? product.features.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium text-base">
                                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={14} strokeWidth={3} /></div>{item}
                                    </li>
                                 )) : (['עיצוב נקי ומודרני', 'תמיכה מלאה ב-RTL', 'רספונסיביות מלאה'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium text-base">
                                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={14} strokeWidth={3} /></div>{item}
                                    </li>
                                 )))}
                              </ul>
                           </div>
                           <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                              <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg"><Layers className="text-slate-500" size={24} /> מה כלול בחבילה?</h4>
                              <ul className="space-y-4">
                                 {product.includes?.length ? product.includes.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium"><div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm"><FileCode size={18} className="text-slate-400" /></div>{item}</li>
                                 )) : (
                                    <><li className="flex items-center gap-3 text-slate-700 font-medium"><div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm"><FileCode size={18} className="text-slate-400" /></div>קובץ המקור (Source File)</li></>
                                 )}
                              </ul>
                           </div>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                           <div className="pt-8 border-t border-slate-100">
                              <h4 className="font-bold text-slate-900 mb-4">תגיות</h4>
                              <div className="flex flex-wrap gap-2">
                                 {product.tags.map(tag => (
                                    <span key={tag} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium transition-colors cursor-pointer">#{tag}</span>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                   )}

                   {activeTab === 'comments' && (
                      <div className="animate-fadeIn">
                          <div className="flex gap-4 mb-10">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  {user ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : <User className="text-slate-400" />}
                              </div>
                              <div className="flex-1">
                                  <textarea disabled={!user} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={user ? "כתוב תגובה..." : "התחבר כדי להגיב"} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none min-h-[100px]" />
                                  <div className="flex justify-end mt-2">
                                      <button disabled={!user || !newComment.trim() || postingComment} onClick={handlePostComment} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">{postingComment ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} שלח תגובה</button>
                                  </div>
                              </div>
                          </div>

                          {loadingComments && comments.length === 0 ? (
                             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
                          ) : comments.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="text-slate-300" size={24} /></div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">אין עדיין תגובות</h3>
                                <p className="text-slate-500 text-sm">היה הראשון להגיב על מוצר זה!</p>
                            </div>
                          ) : (
                              <div className="space-y-6">
                                  {comments.map(comment => (
                                      <div key={comment.id} className="flex gap-4">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden"><img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" /></div>
                                          <div>
                                              <div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-900">{comment.user_name}</span><span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString('he-IL')}</span></div>
                                              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl rounded-tr-none">{comment.content}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                   )}

                   {activeTab === 'support' && (
                      <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 text-center md:text-right">
                         <h4 className="font-bold text-xl text-slate-900 mb-4">מדיניות תמיכה</h4>
                         <p className="text-slate-600 mb-8 leading-relaxed max-w-2xl">היוצר מספק תמיכה למוצר זה למשך 6 חודשים מיום הרכישה.</p>
                      </div>
                   )}
                </div>
            </div>

         </div>

         {/* COLUMN 2: Sidebar (Left side in RTL) */}
         <div className="w-full lg:w-[380px] order-2 lg:order-2 flex flex-col gap-6 lg:sticky lg:top-24 sidebar-item">
            
            {/* Action Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="text-sm font-bold text-slate-400">מחיר</span>
                    <h2 className="text-4xl font-black text-slate-900 flex items-start gap-1"><span className="text-lg mt-1">₪</span>{product.price > 0 ? product.price : '0'}</h2>
                  </div>
                  {isFree && <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">Free Download</span>}
               </div>
               
               {!isFree && (
                 <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                    <button onClick={() => setSelectedLicense('regular')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedLicense === 'regular' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>רשיון רגיל</button>
                    <button onClick={() => setSelectedLicense('extended')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedLicense === 'extended' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>רשיון מורחב</button>
                 </div>
               )}

               <button onClick={handleAction} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4 ${isFree ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'}`}>
                  {isFree ? (<>{user ? <Download size={20} /> : <Lock size={20} />}<span>{user ? 'הורד עכשיו' : 'התחבר להורדה'}</span></>) : (<><ShoppingCart size={20} /><span>הוסף לסל הקניות</span></>)}
               </button>

               <ul className="space-y-3 mb-4">
                  <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><Check size={16} className="text-emerald-500" /><span>קבצי מקור כלולים (Figma/Sketch)</span></li>
                  <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><Check size={16} className="text-emerald-500" /><span>שימוש מסחרי מותר</span></li>
               </ul>
            </div>

            {/* Author Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:border-blue-200 transition-colors group" onClick={() => onAuthorClick && onAuthorClick(product.author)}>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">נוצר על ידי</h3>
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-blue-500 transition-colors">
                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(product.author)}&background=random`} alt={product.author} className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{product.author}</h4>
                     <p className="text-xs text-slate-500">הצטרף ב-2023</p>
                  </div>
               </div>
               
               {/* Follow/Chat Actions */}
               {authorUser && (!user || user.id !== authorUser.id) && (
                   <div className="flex gap-2">
                       <button 
                         onClick={handleFollow}
                         className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${isFollowing ? 'bg-slate-100 text-slate-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                       >
                           {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                           {isFollowing ? 'עוקב' : 'עקוב'}
                       </button>
                       <button
                         onClick={(e) => { e.stopPropagation(); onOpenChat && onOpenChat(authorUser); }}
                         className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                       >
                           <MessageCircle size={14} />
                           הודעה
                       </button>
                   </div>
               )}
            </div>

            {/* Meta Info */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-sm text-slate-500 font-medium">תאריך פרסום</span>
                   <span className="text-sm text-slate-900 font-bold">{product.created_at ? new Date(product.created_at).toLocaleDateString('he-IL') : new Date().toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-50">
                   <span className="text-sm text-slate-500 font-medium">צפיות</span>
                   <span className="text-sm text-slate-900 font-bold flex items-center gap-1"><Eye size={12} /> {(product.views || 0).toLocaleString()}</span>
                </div>
            </div>

         </div>

      </div>
    </div>
  );
};