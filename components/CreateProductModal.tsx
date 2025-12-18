import React, { useState } from 'react';
import { X, Upload, Check, DollarSign, Tag, Type, Loader2, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Category } from '../types';
import { CATEGORIES } from '../constants';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onProductCreated: () => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({ isOpen, onClose, user, onProductCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>('ערכות UI');
  const [tags, setTags] = useState('');
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        alert("הקובץ גדול מדי. אנא בחר תמונה עד 5MB");
        return;
      }

      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate Image
    if (!imageFile) {
        setError("חובה להעלות תמונה למוצר");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = '';

      // 1. Upload Image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) {
            console.error('Upload Error:', uploadError);
            if (uploadError.message.includes('Bucket not found') || (uploadError as any).error === 'Bucket not found') {
                setError('שגיאה קריטית: "Bucket not found". אנא הרץ את סקריפט ה-SQL (Database Setup) שוב כדי ליצור את תיקיית האחסון.');
            } else {
                setError(`שגיאה בהעלאת התמונה: ${uploadError.message}`);
            }
            setLoading(false);
            return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      finalImageUrl = publicUrl;
      

      // 2. Insert Product
      const newProduct = {
        title,
        price: Number(price) || 0,
        category,
        image: finalImageUrl,
        author: user.name,
        rating: 5.0, // Default start rating
        sales: 0,
        downloads: 0,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const { error } = await supabase
        .from('products')
        .insert([newProduct]);

      if (error) throw error;

      onProductCreated();
      onClose();
      // Reset form
      setTitle('');
      setPrice('');
      setTags('');
      clearImage();

    } catch (error: any) {
      setError('שגיאה ביצירת המוצר: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800">הוסף מוצר חדש</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
           {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold animate-shake">
                   <AlertCircle size={20} className="shrink-0 mt-0.5" />
                   <div>
                       <p>{error}</p>
                       {error.includes('Bucket not found') && (
                           <p className="mt-1 text-xs font-normal text-red-500">לחץ על כפתור "Fix DB" במסך הראשי כדי לקבל את הסקריפט המתוקן.</p>
                       )}
                   </div>
               </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Image Upload Area */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">תמונה ראשית <span className="text-red-500">*</span></label>
                 <div className="relative group">
                    <input 
                       type="file" 
                       accept="image/*"
                       onChange={handleFileChange}
                       className="hidden" 
                       id="image-upload"
                    />
                    
                    {!previewUrl ? (
                      <label 
                          htmlFor="image-upload" 
                          className={`w-full h-40 border-2 border-dashed ${error?.includes('תמונה') ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'} hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-3 group/label`}
                      >
                          <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm ${error?.includes('תמונה') ? 'text-red-400' : 'text-slate-400'} group-hover/label:text-blue-500 group-hover/label:scale-110 transition-all`}>
                             <Upload size={20} />
                          </div>
                          <div className="text-center">
                             <span className="block text-sm font-bold text-slate-600 group-hover/label:text-blue-600">לחץ להעלאת תמונה</span>
                             <span className="block text-[10px] text-slate-400 mt-1">JPG, PNG עד 5MB</span>
                          </div>
                      </label>
                    ) : (
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                             <label htmlFor="image-upload" className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl cursor-pointer backdrop-blur-md transition-colors">
                                <Upload size={18} />
                             </label>
                             <button type="button" onClick={clearImage} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition-colors">
                                <Trash2 size={18} />
                             </button>
                          </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">שם המוצר</label>
                 <div className="relative">
                    <Type className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-800"
                      placeholder="לדוגמה: UI Kit למסעדות"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Price */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">מחיר (₪)</label>
                    <div className="relative">
                        <DollarSign className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                        <input 
                          type="number"
                          min="0"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-800"
                          placeholder="0 = חינם"
                        />
                    </div>
                 </div>

                 {/* Category */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">קטגוריה</label>
                    <div className="relative">
                       <select 
                          value={category}
                          onChange={e => setCategory(e.target.value as Category)}
                          className="w-full pr-4 pl-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                       >
                          {CATEGORIES.filter(c => c !== 'הכל').map(c => (
                             <option key={c} value={c}>{c}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">תגיות (מופרדות בפסיק)</label>
                 <div className="relative">
                    <Tag className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-600"
                      placeholder="עיצוב, נקי, מודרני..."
                    />
                 </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                <span>{loading ? 'מעלה...' : 'פרסם מוצר'}</span>
              </button>

           </form>
        </div>
      </div>
    </div>
  );
};