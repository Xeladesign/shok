import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Info, Clock, ThumbsUp, Share2, ArrowRight,
  MoreVertical, Loader2, CheckCircle, UserPlus, Copy, Check, MessageSquare, Send, User, Trash2, Heart
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { HubVideo } from '../types';
import gsap from 'gsap';

// --- Helper Functions ---

const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('vimeo.com/')) {
        const id = url.split('vimeo.com/')[1]?.split('?')[0];
        return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return url;
};

const isExternalProvider = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
};

// --- Components ---

const VideoCard: React.FC<{ video: HubVideo, onClick: (v: HubVideo) => void }> = ({ video, onClick }) => {
    return (
        <div 
          onClick={() => onClick(video)}
          className="group flex flex-col gap-3 cursor-pointer p-3 rounded-2xl hover:bg-white/5 transition-all duration-300"
        >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1a1a] shadow-lg group-hover:shadow-blue-500/10 transition-all border border-white/5 group-hover:border-white/20">
                <img src={video.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800'} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white/10 tracking-wider">{video.duration}</div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                        <Play size={20} fill="white" className="text-white ml-1" />
                    </div>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-start mb-1.5">
                   <h4 className="text-white font-bold text-[15px] leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 pl-2 tracking-tight">{video.title}</h4>
                   <button className="text-gray-500 hover:text-white shrink-0 p-1" onClick={(e) => e.stopPropagation()}><MoreVertical size={14} /></button>
                </div>
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                      <span className="hover:text-white transition-colors">{video.author}</span>
                      <CheckCircle size={12} className="text-blue-500" />
                   </div>
                   <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                      <span>{(video.views || 0).toLocaleString()} צפיות</span>
                      <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                      <span>{video.created_at ? new Date(video.created_at).toLocaleDateString('he-IL') : 'היום'}</span>
                   </div>
                </div>
            </div>
        </div>
    );
};

const VideoPlayerView: React.FC<{ video: HubVideo, onBack: () => void, onVideoClick: (v: HubVideo) => void, currentUser: any }> = ({ video, onBack, onVideoClick, currentUser }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [likes, setLikes] = useState(video.likes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [relatedVideos, setRelatedVideos] = useState<HubVideo[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(true);
    const [showShareToast, setShowShareToast] = useState(false);
    
    // Comments System
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const embedUrl = getEmbedUrl(video.video_url);
    const isExternal = isExternalProvider(video.video_url);

    useEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(containerRef.current.querySelectorAll('.gsap-item'), 
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'expo.out' }
            );
        }
        fetchRelatedVideos();
        fetchComments();
        incrementVideoViews();
        checkFollowStatus();
    }, [video.id]);

    const fetchRelatedVideos = async () => {
        setLoadingRelated(true);
        try {
            const { data } = await supabase.from('hub_videos').select('*').neq('id', video.id).order('created_at', { ascending: false }).limit(10);
            if (data) setRelatedVideos(data as HubVideo[]);
        } catch (e) { console.error(e); } finally { setLoadingRelated(false); }
    };

    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const { data } = await supabase.from('hub_video_comments').select('*').eq('video_id', video.id).order('created_at', { ascending: false });
            if (data) setComments(data);
        } catch (e) { console.error(e); } finally { setIsLoadingComments(false); }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert('עליך להתחבר כדי להגיב');
            const event = new CustomEvent('open-login');
            document.dispatchEvent(event);
            return;
        }
        if (!commentText.trim() || isPosting) return;

        setIsPosting(true);
        try {
            const { data, error } = await supabase.from('hub_video_comments').insert({
                video_id: video.id,
                user_id: currentUser.id,
                user_name: currentUser.name,
                user_avatar: currentUser.avatar,
                content: commentText.trim()
            }).select().single();

            if (error) throw error;
            if (data) {
                setComments(prev => [data, ...prev]);
                setCommentText('');
            }
        } catch (e) { alert('שגיאה בפרסום התגובה'); } finally { setIsPosting(false); }
    };

    const handleDeleteComment = async (id: number) => {
        if (!confirm('למחוק את התגובה?')) return;
        const { error } = await supabase.from('hub_video_comments').delete().eq('id', id);
        if (!error) setComments(prev => prev.filter(c => c.id !== id));
    };

    const checkFollowStatus = async () => {
        if (!currentUser) return;
        try {
            const { data: creator } = await supabase.from('users').select('id').eq('name', video.author).maybeSingle();
            if (creator) {
                const { data } = await supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', creator.id).maybeSingle();
                if (data) setIsFollowing(true);
            }
        } catch (e) { console.error(e); }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            const event = new CustomEvent('open-login');
            document.dispatchEvent(event);
            return;
        }
        try {
            const { data: creator } = await supabase.from('users').select('id').eq('name', video.author).maybeSingle();
            if (!creator) {
                alert("לא נמצא פרופיל ליוצר זה");
                return;
            }

            if (isFollowing) {
                await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', creator.id);
                setIsFollowing(false);
            } else {
                await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: creator.id });
                setIsFollowing(true);
                await supabase.from('notifications').insert({
                    user_id: creator.id,
                    actor_id: currentUser.id,
                    actor_name: currentUser.name,
                    actor_avatar: currentUser.avatar,
                    type: 'follow'
                });
            }
        } catch (e) { console.error(e); }
    };

    const incrementVideoViews = async () => {
        try { await supabase.from('hub_videos').update({ views: (video.views || 0) + 1 }).eq('id', video.id); } catch (e) { console.error(e); }
    };

    const handleLike = async () => {
        const newIsLiked = !isLiked;
        const newLikesCount = newIsLiked ? likes + 1 : likes - 1;
        setIsLiked(newIsLiked);
        setLikes(newLikesCount);
        try { await supabase.from('hub_videos').update({ likes: newLikesCount }).eq('id', video.id); } catch (e) { console.error(e); }
    };

    const handleShare = async () => {
        const url = window.location.origin + '?video=' + video.id;
        if (navigator.share) {
            try { await navigator.share({ title: video.title, url }); } catch (e) {}
        } else {
            navigator.clipboard.writeText(url);
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 2000);
        }
    };

    return (
        <div ref={containerRef} className="animate-fadeIn pb-24 w-full min-h-screen bg-[#050505] custom-scrollbar overflow-x-hidden">
            {/* Minimal Sticky Nav */}
            <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5 px-6 md:px-12 h-20 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all group-hover:scale-110">
                        <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span className="text-white font-black text-sm tracking-widest uppercase">Explore Hub</span>
                </button>
                <div className="flex items-center gap-6">
                     <div className="hidden md:flex flex-col text-right">
                         <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-0.5">Category</span>
                         <span className="text-sm font-black text-blue-500">{video.category}</span>
                     </div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                
                {/* Cinema Column */}
                <div className="lg:col-span-8 space-y-12">
                    
                    {/* Grand Player */}
                    <div className="gsap-item group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-full aspect-video bg-black rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
                            {isExternal ? (
                                <iframe src={embedUrl} className="w-full h-full" title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            ) : (
                                <div className="w-full h-full relative">
                                    {!isPlaying ? (
                                        <>
                                            <img src={video.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1200'} className="w-full h-full object-cover opacity-50 transition-transform duration-[2s] group-hover:scale-110" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <button onClick={() => setIsPlaying(true)} className="w-32 h-32 bg-white/10 backdrop-blur-3xl border border-white/20 text-white hover:bg-blue-600 hover:border-blue-500 hover:scale-110 transition-all rounded-full flex items-center justify-center shadow-2xl group/btn">
                                                    <Play size={56} fill="white" className="ml-2 drop-shadow-2xl" />
                                                </button>
                                            </div>
                                            <div className="absolute top-10 left-10"><span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-2xl">Premium UHD</span></div>
                                        </>
                                    ) : (
                                        <video ref={videoRef} src={video.video_url} className="w-full h-full" controls autoPlay playsInline />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Information Cluster */}
                    <div className="gsap-item space-y-10">
                        <div className="flex flex-col gap-6">
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">{video.title}</h1>
                            
                            <div className="flex flex-wrap items-center justify-between gap-8 py-8 border-y border-white/5">
                                 {/* Dynamic Creator Profile */}
                                 <div className="flex items-center gap-6 group cursor-pointer">
                                     <div className="relative">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:rotate-6 transition-transform">
                                            {video.author.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#050505] rounded-full shadow-lg"></div>
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-white text-2xl tracking-tighter group-hover:text-blue-400 transition-colors">{video.author}</h4>
                                            <CheckCircle size={18} className="text-blue-500" />
                                         </div>
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Verified Creator Hub Partner</p>
                                     </div>
                                     <button 
                                        onClick={handleFollow}
                                        className={`mr-4 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${isFollowing ? 'bg-white/5 text-white border-white/10 hover:bg-red-500/10 hover:border-red-500/50 group/unfollow' : 'bg-white text-black border-white hover:bg-gray-200'}`}
                                     >
                                         {isFollowing ? 'Following' : 'Follow'}
                                     </button>
                                 </div>

                                 {/* Global Interactions */}
                                 <div className="flex items-center gap-4">
                                     <button onClick={handleLike} className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all border ${isLiked ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'}`}>
                                         <Heart size={18} fill={isLiked ? "white" : "none"} />
                                         <span>{likes.toLocaleString()} Likes</span>
                                     </button>
                                     <button onClick={handleShare} className="relative flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] text-gray-400 text-xs font-black uppercase tracking-widest transition-all border border-white/10 group active:scale-95">
                                         <Share2 size={18} />
                                         <span>Share</span>
                                         {showShareToast && <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-4 py-2 rounded-xl shadow-2xl animate-bounceIn whitespace-nowrap font-black">COPIED TO CLIPBOARD</div>}
                                     </button>
                                 </div>
                            </div>
                        </div>

                        {/* Expandable Story / Description */}
                        <div className="bg-white/[0.02] rounded-[3rem] border border-white/5 p-12 relative overflow-hidden group/desc">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none group-hover/desc:opacity-100 opacity-50 transition-opacity"></div>
                            <div className="flex gap-8 mb-10 items-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact</span>
                                    <span className="text-white font-black text-lg">{(video.views || 0).toLocaleString()} Views</span>
                                </div>
                                <div className="w-px h-8 bg-white/5"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Premiered</span>
                                    <span className="text-gray-400 font-bold">{video.created_at ? new Date(video.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TODAY'}</span>
                                </div>
                            </div>
                            <p className="text-gray-400 leading-[1.8] text-xl whitespace-pre-wrap font-medium selection:bg-blue-600/30 selection:text-white">{video.description || "The story behind this masterpiece remains a mystery."}</p>
                            <div className="flex flex-wrap gap-3 mt-12">
                                {video.tags?.map(tag => <span key={tag} className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all cursor-pointer uppercase tracking-widest">#{tag}</span>)}
                            </div>
                        </div>
                        
                        {/* Premium Comments Interface */}
                        <div className="gsap-item pt-10">
                             <div className="flex items-center justify-between mb-12">
                                 <div className="flex items-center gap-5">
                                    <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter">Community Feedback</h3>
                                 </div>
                                 <span className="bg-white/5 text-gray-500 text-xs font-black px-5 py-2 rounded-full border border-white/5">{comments.length} Comments</span>
                             </div>

                             <form onSubmit={handlePostComment} className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 flex gap-6 mb-16 focus-within:bg-white/[0.05] transition-all">
                                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden shadow-xl">
                                     {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <User className="text-gray-500" size={32} />}
                                 </div>
                                 <div className="flex-1 space-y-4">
                                     <textarea 
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Add to the conversation..." 
                                        className="w-full bg-transparent border-none p-0 text-white text-xl focus:ring-0 outline-none resize-none min-h-[80px] transition-all placeholder:text-gray-700"
                                     />
                                     <div className="flex justify-end">
                                         <button disabled={!commentText.trim() || isPosting} type="submit" className="bg-white text-black px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-20">
                                             {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                             Post Reaction
                                         </button>
                                     </div>
                                 </div>
                             </form>

                             <div className="space-y-12 pl-6">
                                 {isLoadingComments ? (
                                     <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
                                 ) : comments.length === 0 ? (
                                     <div className="text-center py-32 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5">
                                         <MessageSquare className="mx-auto text-gray-800 mb-6" size={64} />
                                         <p className="text-gray-600 font-black text-lg uppercase tracking-widest">Be the first to speak.</p>
                                     </div>
                                 ) : (
                                     comments.map(c => (
                                         <div key={c.id} className="flex gap-8 group animate-fadeIn">
                                             <div className="relative shrink-0">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
                                                    <img src={c.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name)}&background=random`} className="w-full h-full object-cover" />
                                                </div>
                                             </div>
                                             <div className="flex-1 space-y-3">
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-4">
                                                        <span className="font-black text-white text-lg tracking-tight">{c.user_name}</span>
                                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full opacity-40"></div>
                                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString('he-IL')}</span>
                                                     </div>
                                                     {currentUser?.id === c.user_id && (
                                                         <button onClick={() => handleDeleteComment(c.id)} className="text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                     )}
                                                 </div>
                                                 <p className="text-gray-400 text-lg leading-relaxed">{c.content}</p>
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Sidebar */}
                <div className="lg:col-span-4 space-y-12 gsap-item sticky top-32">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-1 text-blue-600 rounded-full"></div>
                            <h3 className="text-xl font-black text-white tracking-[0.2em] uppercase">Up Next</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {loadingRelated ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : relatedVideos.length === 0 ? (
                                <p className="text-gray-700 text-center py-10 font-black uppercase tracking-widest">No recommendations yet.</p>
                            ) : (
                                relatedVideos.map(item => (
                                    <div key={item.id} onClick={() => onVideoClick(item)} className="flex gap-6 group cursor-pointer p-4 rounded-[2rem] hover:bg-white/[0.03] transition-all duration-500 border border-transparent hover:border-white/5">
                                        <div className="w-40 h-28 rounded-2xl overflow-hidden bg-black shrink-0 border border-white/10 relative shadow-2xl group-hover:scale-95 transition-transform">
                                            <img src={item.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-[1s]" />
                                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[8px] font-black text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">{item.duration}</div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                                            <h4 className="text-[16px] font-black text-white line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors tracking-tight">{item.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.author}</span>
                                                <CheckCircle size={10} className="text-blue-600" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-700">{(item.views || 0).toLocaleString()} Views</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const TutorialsFeed: React.FC<{ onVideoClick: (v: HubVideo) => void }> = ({ onVideoClick }) => {
  const [videos, setVideos] = useState<HubVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchVideos = async () => {
          setLoading(true);
          try {
            const { data } = await supabase.from('hub_videos').select('*').order('created_at', { ascending: false });
            if (data) setVideos(data as HubVideo[]);
          } catch (e) { console.error(e); } finally { setLoading(false); }
      };
      fetchVideos();
  }, []);

  return (
    <div className="bg-[#0A0A0A] min-h-full text-white -m-1 pb-20 animate-fadeIn">
       <div className="relative w-full h-[50vh] md:h-[65vh] mb-12 group overflow-hidden">
           <div className="absolute inset-0">
               <img src="https://images.unsplash.com/photo-1626544827763-d516dce335ca?auto=format&fit=crop&q=80&w=2000" alt="Hero" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-black/30"></div>
               <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A]/10 to-transparent"></div>
           </div>
           <div className="absolute bottom-0 right-0 p-8 md:p-24 max-w-4xl z-10 text-right">
                <div className="flex items-center justify-end gap-3 mb-8 animate-fadeIn">
                   <span className="bg-blue-600 text-white text-[11px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40">Premium Hub</span>
                   <span className="text-xs font-black tracking-[0.2em] uppercase text-white/50 border border-white/10 px-5 py-1.5 rounded-full backdrop-blur-2xl">Design Intelligence</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-black mb-10 leading-[0.8] text-white drop-shadow-2xl tracking-tighter">FUTURE <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">CANVAS</span></h1>
                <p className="text-2xl text-gray-400 mb-12 drop-shadow-lg font-bold line-clamp-2 pl-8 opacity-90 max-w-2xl mr-auto leading-relaxed">גלו את הסרטונים וההדרכות המתקדמות ביותר עבור מעצבים ויוצרים בדיגיטל הישראלי.</p>
                <div className="flex justify-end gap-6">
                    <button className="flex items-center gap-3 bg-white text-black px-12 py-5 rounded-[2rem] hover:bg-gray-200 font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/5">
                        <Play size={28} fill="currentColor" />
                        <span>צפה בהכל</span>
                    </button>
                    <button className="flex items-center gap-3 bg-white/5 backdrop-blur-3xl border border-white/10 text-white px-12 py-5 rounded-[2rem] hover:bg-white/10 font-black text-xl transition-all">
                        <Info size={28} />
                        <span>פרטים נוספים</span>
                    </button>
                </div>
           </div>
       </div>

       <div className="px-4 md:px-16 relative z-20">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 border-b border-white/5 pb-12 gap-8">
               <div>
                   <h2 className="text-4xl font-black text-white flex items-center gap-5 mb-3 tracking-tighter">
                       <Clock className="text-blue-500 w-8 h-8" />
                       הועלו לאחרונה
                   </h2>
                   <p className="text-gray-500 text-lg font-bold">הצטרפו לאלפי לומדים בהדרכות ה-Hub שלנו</p>
               </div>
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                   {['הכל', 'UI Design', 'Figma', 'Business', 'Dev'].map((tag, i) => (
                       <button key={tag} className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all border ${i === 0 ? 'bg-white text-black border-white shadow-2xl shadow-white/5' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}`}>{tag}</button>
                   ))}
               </div>
           </div>

           {loading ? (
               <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>
           ) : videos.length === 0 ? (
                <div className="text-center py-32 text-gray-500 bg-white/5 rounded-[4rem] border border-dashed border-white/10">אין עדיין סרטונים להצגה.</div>
           ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
                    {videos.map(video => <VideoCard key={video.id} video={video} onClick={onVideoClick} />)}
                </div>
           )}
       </div>
    </div>
  );
};

// --- Main Hub Component ---

export const CreatorsHub = () => {
  const [selectedVideo, setSelectedVideo] = useState<HubVideo | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
            setUser({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0],
                avatar: user.user_metadata?.avatar_url
            });
        }
    });
  }, []);

  const handleVideoSelection = (v: HubVideo) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedVideo(v);
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] relative overflow-hidden">
       <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {selectedVideo ? (
            <VideoPlayerView 
                video={selectedVideo} 
                onBack={() => setSelectedVideo(null)} 
                onVideoClick={handleVideoSelection}
                currentUser={user}
            />
          ) : (
            <TutorialsFeed onVideoClick={handleVideoSelection} />
          )}
       </div>
    </div>
  );
};