import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { HubVideo } from '../types';
import { Plus, Trash2, Edit2, Save, X, Loader2, Upload, Video, Image as ImageIcon, AlertCircle, Settings } from 'lucide-react';

interface AdminHubDashboardProps {
  user: any;
}

// Limits (Bytes)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB

export const AdminHubDashboard: React.FC<AdminHubDashboardProps> = ({ user }) => {
  const [videos, setVideos] = useState<HubVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<HubVideo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<HubVideo>>({
    title: '',
    description: '',
    category: 'UI Design',
    duration: '10:00',
    video_url: '',
    thumbnail: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('hub_videos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setVideos(data as HubVideo[]);
    if (error) console.error(error);
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הסרטון?')) return;
    
    const { error } = await supabase.from('hub_videos').delete().eq('id', id);
    if (!error) {
        setVideos(prev => prev.filter(v => v.id !== id));
    } else {
        alert('Error deleting video: ' + error.message);
    }
  };

  const handleEdit = (video: HubVideo) => {
    setFormData(video);
    setIsEditing(video);
    setIsCreating(false);
    setThumbnailFile(null);
    setVideoFile(null);
    setError(null);
  };

  const handleCreate = () => {
    setFormData({
        title: '',
        description: '',
        category: 'UI Design',
        duration: '',
        video_url: '',
        thumbnail: '',
        tags: [],
        author: user?.name || 'CreatorsHub',
        views: 0
    });
    setIsCreating(true);
    setIsEditing(null);
    setThumbnailFile(null);
    setVideoFile(null);
    setError(null);
  };

  const uploadFile = async (file: File, folder: string) => {
      // 1. Client-side Size Validation
      const isVideo = folder === 'videos';
      const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      
      if (file.size > limit) {
          throw new Error(`הקובץ "${file.name}" גדול מדי. המקסימום המותר ל${isVideo ? 'סרטון' : 'תמונה'} הוא ${limit / (1024 * 1024)}MB.`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      console.log(`Attempting upload for ${user?.email} to bucket: hub-content`);

      const { error: uploadError } = await supabase.storage
        .from('hub-content')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

      if (uploadError) {
          console.error("Detailed Upload Error:", uploadError);
          
          if (uploadError.message.includes('exceeded the maximum allowed size')) {
              throw new Error(`שגיאת שרת: הקובץ חורג מהמגבלה המוגדרת ב-Supabase (בדרך כלל 5MB). יש להגדיל את המגבלה ב-Dashboard של Supabase או להריץ את ה-SQL המעודכן ב-DB Setup.`);
          }
          
          if (uploadError.message.includes('violates row-level security policy')) {
              throw new Error(`שגיאת הרשאות: המשתמש (${user?.email}) לא מורשה להעלות קבצים. וודא שהרצת את הסקריפט המעודכן ב-DB Setup.`);
          }
          if (uploadError.message.includes('Bucket not found')) {
              throw new Error('שגיאה: התיקייה "hub-content" לא קיימת בשרת. נא ליצור אותה ידנית ב-Supabase Storage.');
          }
          throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hub-content')
        .getPublicUrl(fileName);
        
      return publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(10);
    setError(null);

    try {
        let thumbUrl = formData.thumbnail;
        let finalVideoUrl = formData.video_url;

        // 1. Upload Thumbnail
        if (thumbnailFile) {
            setUploadProgress(20);
            thumbUrl = await uploadFile(thumbnailFile, 'thumbnails');
        }

        // 2. Upload Video File
        if (videoFile) {
            setUploadProgress(40);
            finalVideoUrl = await uploadFile(videoFile, 'videos');
        }

        if (!finalVideoUrl && !videoFile && !isEditing) {
            throw new Error('נא להעלות סרטון או להזין קישור');
        }

        setUploadProgress(80);
        
        const payload = {
            ...formData,
            thumbnail: thumbUrl,
            video_url: finalVideoUrl,
            tags: formData.tags || [],
            author: formData.author || user?.name || 'CreatorsHub'
        };

        if (isEditing) {
            const { error: dbError } = await supabase
                .from('hub_videos')
                .update(payload)
                .eq('id', isEditing.id);
            if (dbError) throw dbError;
        } else {
            const { error: dbError } = await supabase
                .from('hub_videos')
                .insert([payload]);
            if (dbError) throw dbError;
        }

        setUploadProgress(100);
        setTimeout(() => {
            fetchVideos();
            setIsCreating(false);
            setIsEditing(null);
            setSaving(false);
            setUploadProgress(0);
        }, 500);

    } catch (e: any) {
        console.error("Save Flow Error:", e);
        setError(e.message || "שגיאה לא ידועה בשמירה");
        setSaving(false);
        setUploadProgress(0);
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          e.preventDefault();
          if (!formData.tags?.includes(tagInput.trim())) {
              setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
          }
          setTagInput('');
      }
  };

  const removeTag = (tag: string) => {
      setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }));
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50" dir="rtl">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900">ניהול תוכן Hub</h1>
                <p className="text-slate-500">ניהול סרטונים, הדרכות ותכנים</p>
            </div>
            <button 
                onClick={handleCreate}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
                <Plus size={20} />
                הוסף סרטון חדש
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-2 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">אין סרטונים להצגה</div>
                ) : (
                    videos.map(video => (
                        <div key={video.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                            <div className="w-40 aspect-video bg-slate-100 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                                <img src={video.thumbnail || 'https://via.placeholder.com/160x90?text=No+Thumb'} className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">{video.duration}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{video.title}</h3>
                                <p className="text-sm text-slate-500 mb-2 line-clamp-2">{video.description}</p>
                                <div className="flex gap-2">
                                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-lg font-bold">{video.category}</span>
                                    <span className="bg-slate-50 text-slate-500 text-xs px-2 py-0.5 rounded-lg">{video.views} צפיות</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleEdit(video)} className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(video.id)} className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form */}
            {(isCreating || isEditing) && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl h-fit sticky top-6 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800">{isEditing ? 'עריכת סרטון' : 'סרטון חדש'}</h2>
                        <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="text-slate-400 hover:text-slate-600"><X /></button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex flex-col gap-3 border border-red-100">
                            <div className="flex items-center gap-2 text-right">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                            {(error.includes('maximum allowed size') || error.includes('גדול מדי')) && (
                                <div className="text-[10px] font-medium text-red-500 bg-white p-3 rounded-lg border border-red-100 flex flex-col gap-2">
                                    <p>💡 טיפ: מגבלת ברירת המחדל של Supabase היא 5MB.</p>
                                    <p>כדי להעלות סרטונים גדולים, עליך להיכנס ל-Dashboard של Supabase -> Storage -> לחץ על שלוש הנקודות ליד ה-Bucket -> Edit Bucket -> והגדל את ה-Maximum File Size ל-100MB.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">כותרת</label>
                            <input 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-900"
                                placeholder="כותרת הסרטון"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">תיאור</label>
                            <textarea 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none h-24 resize-none text-slate-900"
                                placeholder="על מה הסרטון..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">קטגוריה</label>
                                <select 
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900"
                                >
                                    <option>UI Design</option>
                                    <option>Figma</option>
                                    <option>Dev</option>
                                    <option>Business</option>
                                    <option>Trends</option>
                                    <option>Mobile</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">משך (MM:SS)</label>
                                <input 
                                    value={formData.duration} 
                                    onChange={e => setFormData({...formData, duration: e.target.value})}
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900"
                                    placeholder="10:00"
                                />
                            </div>
                        </div>

                        {/* Video Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">קובץ סרטון (MP4) - עד 100MB</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="file" 
                                    accept="video/*"
                                    onChange={e => e.target.files && setVideoFile(e.target.files[0])}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label htmlFor="video-upload" className={`flex-1 p-3 bg-slate-50 border border-dashed rounded-xl cursor-pointer hover:bg-slate-100 flex items-center justify-center text-slate-500 gap-2 transition-colors ${videoFile ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-300'}`}>
                                    <Video size={18} />
                                    <span className="text-sm truncate">{videoFile ? videoFile.name : 'בחר קובץ סרטון'}</span>
                                </label>
                            </div>
                            <div className="relative flex items-center">
                                <div className="flex-grow border-t border-slate-100"></div>
                                <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">או</span>
                                <div className="flex-grow border-t border-slate-100"></div>
                            </div>
                            <input 
                                value={formData.video_url} 
                                onChange={e => setFormData({...formData, video_url: e.target.value})}
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none dir-ltr text-xs text-slate-900"
                                placeholder="קישור ליוטיוב/וימאו..."
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">תמונה ממוזערת (Thumbnail)</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => e.target.files && setThumbnailFile(e.target.files[0])}
                                    className="hidden"
                                    id="thumb-upload"
                                />
                                <label htmlFor="thumb-upload" className={`flex-1 p-3 bg-slate-50 border border-dashed rounded-xl cursor-pointer hover:bg-slate-100 flex items-center justify-center text-slate-500 gap-2 transition-colors ${thumbnailFile ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-300'}`}>
                                    <ImageIcon size={18} />
                                    <span className="text-sm truncate">{thumbnailFile ? thumbnailFile.name : 'בחר תמונה'}</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">תגיות (Enter להוספה)</label>
                            <input 
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={addTag}
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none mb-2 text-slate-900"
                                placeholder="הקלד תגית..."
                            />
                            <div className="flex flex-wrap gap-2">
                                {formData.tags?.map(tag => (
                                    <span key={tag} className="bg-slate-100 px-2 py-1 rounded-lg text-xs flex items-center gap-1 text-slate-700">
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {saving && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-blue-600 uppercase">
                                    <span>מעלה תוכן...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {isEditing ? 'שמור שינויים' : 'צור סרטון'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
};