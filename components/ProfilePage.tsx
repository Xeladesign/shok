import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  User, Mail, Briefcase, Link as LinkIcon, Save, Loader2, 
  Building2, Wallet, Camera, LayoutGrid, Award, Settings, 
  MapPin, Globe, Plus, ArrowUpRight, Image as ImageIcon,
  Edit3, Share2, Check, UserPlus, UserCheck, MessageCircle
} from 'lucide-react';
import { Product } from '../types';

interface ProfilePageProps {
  user: any; // The user profile to display
  isOwnProfile: boolean; // Is the logged-in user viewing their own profile?
  onOpenChat?: (recipient?: any) => void;
}

type TabType = 'portfolio' | 'jobs' | 'settings';

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, isOwnProfile, onOpenChat }) => {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [loading, setLoading] = useState(false);
  
  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Data State
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: 'freelancer',
    bio: '',
    portfolio_url: '',
    payout_method: 'bank',
    location: 'Tel Aviv, Israel' 
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserProducts();
      if (!isOwnProfile) checkFollowStatus();
    }
  }, [user]);

  // Calculate Real Sales
  const totalSales = useMemo(() => {
    return userProducts.reduce((acc, product) => acc + (product.sales || 0), 0);
  }, [userProducts]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || user.name,
          email: user.email,
          role: data.role || 'freelancer',
          bio: data.bio || '',
          portfolio_url: data.portfolio_url || '',
          payout_method: data.payout_method || 'bank'
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('author', user.name) 
        .order('created_at', { ascending: false });
        
      if (data) {
        setUserProducts(data as Product[]);
      }
    } catch (error) {
       console.error("Error fetching user products", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const checkFollowStatus = async () => {
     try {
       const { data: { user: currentUser } } = await supabase.auth.getUser();
       if (!currentUser) return;
       
       const { data } = await supabase
         .from('follows')
         .select('*')
         .eq('follower_id', currentUser.id)
         .eq('following_id', user.id)
         .single();
         
       if (data) setIsFollowing(true);
     } catch (e) {
       console.error(e);
     }
  };

  const handleFollow = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        alert("נא להתחבר כדי לעקוב");
        return;
    }
    
    setLoadingFollow(true);
    try {
       if (isFollowing) {
          // Unfollow
          await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', user.id);
          setIsFollowing(false);
       } else {
          // Follow
          await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: user.id });
          
          // Notify
          await supabase.from('notifications').insert({
              user_id: user.id,
              actor_id: currentUser.id,
              actor_name: currentUser.user_metadata?.name || 'User',
              actor_avatar: currentUser.user_metadata?.avatar_url,
              type: 'follow'
          });

          setIsFollowing(true);
       }
    } catch (e) {
       console.error(e);
    } finally {
       setLoadingFollow(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const updates = {
        id: user.id,
        email: user.email,
        name: formData.name,
        role: formData.role,
        bio: formData.bio,
        portfolio_url: formData.portfolio_url,
        payout_method: formData.payout_method
      };

      const { error } = await supabase.from('users').upsert(updates);

      if (error) throw error;
      setSuccess(true);
      setIsEditing(false); // Exit edit mode
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Error saving profile: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8 mb-2" />
        <span className="text-slate-400 text-sm font-medium">טוען פרופיל...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative">
       
       {/* Hero / Cover Section */}
       <div className="h-48 md:h-64 bg-gradient-to-r from-slate-900 to-slate-800 relative rounded-b-[2.5rem] overflow-hidden shrink-0 group">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[100px]"></div>
          
          {isOwnProfile && (
            <button className="absolute top-6 left-6 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all border border-white/10 opacity-0 group-hover:opacity-100">
               <Camera size={14} />
               <span>שנה תמונת נושא</span>
            </button>
          )}
       </div>

       <div className="px-4 md:px-8 max-w-6xl mx-auto -mt-20 relative z-10 pb-20">
          
          {/* Profile Header Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-white mb-8">
             <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                
                {/* Avatar */}
                <div className="relative -mt-20 md:-mt-24 mx-auto md:mx-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-[6px] border-white shadow-2xl bg-white overflow-hidden relative group">
                        <img 
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                        {isOwnProfile && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Camera className="text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-right w-full">
                    {isEditing ? (
                        <div className="space-y-4 animate-fadeIn">
                             <input 
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="text-3xl font-black text-slate-900 border-b-2 border-blue-500 outline-none w-full md:w-auto bg-transparent"
                              placeholder="שם מלא"
                            />
                            <div className="grid md:grid-cols-2 gap-4">
                                <select 
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none"
                                >
                                    <option value="freelancer">פרילנסר</option>
                                    <option value="studio">סטודיו</option>
                                    <option value="agency">חברה / סוכנות</option>
                                </select>
                                <input 
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none"
                                    placeholder="מיקום"
                                />
                            </div>
                             <textarea 
                              value={formData.bio}
                              onChange={e => setFormData({...formData, bio: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                              placeholder="ביוגרפיה קצרה..."
                            />
                             <div className="flex gap-2 justify-end mt-4">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 font-bold">ביטול</button>
                                <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    שמור
                                </button>
                             </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{formData.name}</h1>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-100 flex items-center gap-1.5">
                                            <Briefcase size={12} className="text-blue-500" />
                                            {formData.role === 'freelancer' ? 'פרילנסר' : formData.role === 'studio' ? 'סטודיו' : 'סוכנות'}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-100 flex items-center gap-1.5">
                                            <MapPin size={12} className="text-red-400" />
                                            {formData.location}
                                        </span>
                                        {formData.portfolio_url && (
                                            <a href={formData.portfolio_url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-slate-50 text-blue-600 rounded-full text-xs font-bold border border-slate-100 flex items-center gap-1.5 hover:bg-blue-50 transition-colors">
                                            <Globe size={12} />
                                            תיק עבודות
                                            </a>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    {isOwnProfile ? (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <Edit3 size={16} />
                                            ערוך פרופיל
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                              onClick={handleFollow}
                                              disabled={loadingFollow}
                                              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isFollowing ? 'bg-slate-100 text-slate-800' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'}`}
                                            >
                                                {loadingFollow ? <Loader2 size={16} className="animate-spin" /> : isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                                {isFollowing ? 'עוקב' : 'עקוב'}
                                            </button>
                                            <button
                                              onClick={() => onOpenChat && onOpenChat(user)}
                                              className="px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            >
                                                <MessageCircle size={16} />
                                                הודעה
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {formData.bio && (
                                <p className="text-slate-500 leading-relaxed max-w-2xl text-center md:text-right">
                                    {formData.bio}
                                </p>
                            )}
                        </>
                    )}
                </div>
             </div>

              {/* Stats Bar */}
             <div className="grid grid-cols-2 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-6">
                <div className="text-center md:text-right border-l border-slate-100 pl-4">
                    <div className="text-2xl font-black text-slate-900">{userProducts.length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase">מוצרים</div>
                </div>
                 <div className="text-center md:text-right">
                    <div className="text-2xl font-black text-slate-900">{totalSales}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase">מכירות</div>
                </div>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
             <button
                 onClick={() => setActiveTab('portfolio')}
                 className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                   activeTab === 'portfolio'
                   ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                   : 'bg-white text-slate-500 hover:bg-slate-50'
                 }`}
               >
                 <LayoutGrid size={18} />
                 <span>תיק עבודות</span>
               </button>

               <button
                 onClick={() => setActiveTab('jobs')}
                 className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                   activeTab === 'jobs'
                   ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                   : 'bg-white text-slate-500 hover:bg-slate-50'
                 }`}
               >
                 <Briefcase size={18} />
                 <span>משרות שפורסמו</span>
               </button>

               {isOwnProfile && (
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                    activeTab === 'settings'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Settings size={18} />
                    <span>הגדרות</span>
                </button>
               )}
          </div>

          {/* Tab Content */}
          <div className="animate-fadeIn">
             
             {activeTab === 'portfolio' && (
                <div className="space-y-6">
                    {/* Header for Portfolio */}
                    {isOwnProfile && (
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">הנכסים שלי</h3>
                            <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
                                <Plus size={16} />
                                הוסף חדש
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingProducts ? (
                          <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                        ) : userProducts.length === 0 ? (
                          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
                             <ImageIcon className="mx-auto text-slate-300 mb-2" size={32} />
                             <p className="text-slate-500 font-bold">עדיין לא הועלו מוצרים</p>
                          </div>
                        ) : (
                          userProducts.map(product => (
                            <div key={product.id} className="bg-white p-2.5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer">
                               <div className="w-full aspect-[4/3] rounded-[1.5rem] bg-slate-100 overflow-hidden mb-3 relative">
                                  <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                               </div>
                               <div className="px-2 pb-2">
                                  <h4 className="font-bold text-slate-800 truncate mb-1">{product.title}</h4>
                                  <div className="flex justify-between items-center">
                                     <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{product.category}</span>
                                     <span className="font-bold text-slate-900 text-sm">₪{product.price}</span>
                                  </div>
                               </div>
                            </div>
                          ))
                        )}
                     </div>
                </div>
             )}

             {activeTab === 'jobs' && (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-white shadow-sm">
                     <Briefcase className="mx-auto text-slate-200 mb-4" size={48} />
                     <h3 className="text-xl font-bold text-slate-800 mb-2">אין משרות פעילות</h3>
                     <p className="text-slate-500">המשתמש עדיין לא פרסם משרות או פרויקטים.</p>
                </div>
             )}

             {activeTab === 'settings' && isOwnProfile && (
                 <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-xl shadow-slate-200/50">
                      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Wallet size={18} /></span>
                        הגדרות תשלום
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <button
                            type="button" 
                            onClick={() => setFormData({...formData, payout_method: 'bank'})}
                            className={`p-6 rounded-3xl border-2 text-right transition-all flex items-center gap-4 group ${formData.payout_method === 'bank' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.payout_method === 'bank' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>
                              <Building2 size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-800 text-lg">העברה בנקאית</div>
                              <div className="text-sm text-slate-500">קבל תשלום ישירות לחשבון הבנק (עמלה 0%)</div>
                            </div>
                            {formData.payout_method === 'bank' && <Check className="text-emerald-500" />}
                        </button>

                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, payout_method: 'paypal'})}
                            className={`p-6 rounded-3xl border-2 text-right transition-all flex items-center gap-4 group ${formData.payout_method === 'paypal' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.payout_method === 'paypal' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>
                              <Wallet size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-800 text-lg">PayPal</div>
                              <div className="text-sm text-slate-500">תשלום מהיר ומאובטח לחשבון הפייפאל</div>
                            </div>
                            {formData.payout_method === 'paypal' && <Check className="text-blue-500" />}
                        </button>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                         <button 
                            onClick={handleSubmit} 
                            disabled={saving}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
                        >
                            {saving ? 'שומר...' : 'שמור הגדרות'}
                        </button>
                      </div>
                   </div>
             )}

          </div>
       </div>
    </div>
  );
};