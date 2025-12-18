import React, { useState } from 'react';
import { 
  X, Upload, Check, DollarSign, Tag, Type, Loader2, 
  Image as ImageIcon, Trash2, AlertCircle, ArrowRight,
  Plus, FileText, Layers, Star, File as FileIcon, List, Box
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Category } from '../types';
import { CATEGORIES } from '../constants';

interface CreateProductPageProps {
  onBack: () => void;
  user: any;
  onProductCreated: () => void;
}

const COMMON_FORMATS = ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'React', 'HTML/CSS', 'Vue', 'Angular', 'Blender'];

export const CreateProductPage: React.FC<CreateProductPageProps> = ({ onBack, user, onProductCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>('ערכות UI');
  const [description, setDescription] = useState('');
  
  // Tags
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Features
  const [currentFeature, setCurrentFeature] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  // Includes
  const [currentInclude, setCurrentInclude] = useState('');
  const [includes, setIncludes] = useState<string[]>([]);

  // Formats
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  
  // Gallery State
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Product File State
  const [productFile, setProductFile] = useState<File | null>(null);

  // --- Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      
      // Filter for size/type if needed
      const validFiles = newFiles.filter(file => file.size <= 5 * 1024 * 1024);
      
      if (validFiles.length < newFiles.length) {
        alert("חלק מהקבצים גדולים מדי (מעל 5MB) ולא נוספו.");
      }

      setFiles(prev => [...prev, ...validFiles]);
      
      // Create previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Allow up to 50MB for digital assets
        if (file.size > 50 * 1024 * 1024) {
             alert("קובץ גדול מדי (מקסימום 50MB)");
             return;
        }
        setProductFile(file);
     }
  };

  const removeImage = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    // Adjust cover index if needed
    if (coverIndex >= newFiles.length) {
      setCoverIndex(Math.max(0, newFiles.length - 1));
    } else if (coverIndex === index) {
       setCoverIndex(0);
    }
  };

  // Helper for adding/removing list items
  const handleAddItem = (
    e: React.KeyboardEvent, 
    value: string, 
    setValue: (v: string) => void, 
    list: string[], 
    setList: (l: string[]) => void
  ) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (!list.includes(value.trim())) {
        setList([...list, value.trim()]);
      }
      setValue('');
    }
  };

  const removeItem = (itemToRemove: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.filter(item => item !== itemToRemove));
  };

  const toggleFormat = (format: string) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (files.length === 0) {
        setError("חובה להעלות לפחות תמונה אחת לגלריה");
        window.scrollTo(0, 0);
        return;
    }

    if (!title.trim()) {
        setError("נא להזין שם למוצר");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      let productFileUrl = null;

      // 1. Upload Gallery Images
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrl);
      }

      // 2. Upload Product File (if exists)
      if (productFile) {
         const fileExt = productFile.name.split('.').pop();
         const fileName = `${user.id}/${Date.now()}_asset.${fileExt}`;
         
         const { error: assetUploadError } = await supabase.storage
            .from('product-files')
            .upload(fileName, productFile);
         
         if (assetUploadError) {
             if (assetUploadError.message.includes('Bucket not found') || (assetUploadError as any).error === 'Bucket not found') {
                throw new Error('חסר Bucket בשם "product-files". אנא הרץ את ה-SQL המעודכן ב-DB Setup.');
             }
             throw assetUploadError;
         }

         const { data: { publicUrl: assetUrl } } = supabase.storage
            .from('product-files')
            .getPublicUrl(fileName);
            
         productFileUrl = assetUrl;
      }

      // Identify main image (cover)
      const mainImage = uploadedUrls[coverIndex];

      // 3. Insert Product
      const newProduct = {
        title,
        price: Number(price) || 0,
        category,
        image: mainImage,
        gallery: uploadedUrls,
        description: description,
        file_url: productFileUrl,
        author: user.name,
        rating: 5.0,
        sales: 0,
        downloads: 0,
        tags: tags,
        features: features,
        includes: includes,
        formats: selectedFormats
      };

      const { error: insertError } = await supabase
        .from('products')
        .insert([newProduct]);

      if (insertError) throw insertError;

      onProductCreated();
      
    } catch (err: any) {
      console.error(err);
      setError('שגיאה ביצירת המוצר: ' + (err.message || 'Unknown error'));
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50 relative pb-20">
       
       {/* Header */}
       <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
               onClick={onBack}
               className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
             >
                <ArrowRight size={20} />
             </button>
             <h1 className="text-xl font-black text-slate-800">העלאת מוצר חדש</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-50 rounded-lg">ביטול</button>
             <button 
               onClick={handleSubmit}
               disabled={loading}
               className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                <span>פרסם מוצר</span>
             </button>
          </div>
       </div>

       <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          
          {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold animate-fadeIn">
                 <AlertCircle size={20} className="shrink-0 mt-0.5" />
                 <div>{error}</div>
             </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* LEFT COLUMN - Main Info */}
             <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Gallery Upload */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                   <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ImageIcon size={20} className="text-blue-500" />
                      גלריית תמונות
                   </h2>
                   
                   {/* Previews Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {previews.map((src, index) => (
                         <div key={index} className={`relative aspect-square rounded-xl overflow-hidden group border-2 transition-all ${coverIndex === index ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100'}`}>
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            
                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                               <button 
                                 onClick={() => setCoverIndex(index)}
                                 className="px-3 py-1 bg-white/90 rounded-full text-[10px] font-bold text-slate-800 hover:bg-white"
                               >
                                  {coverIndex === index ? 'תמונה ראשית' : 'הפוך לראשי'}
                               </button>
                               <button 
                                 onClick={() => removeImage(index)}
                                 className="p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors"
                               >
                                  <Trash2 size={14} />
                               </button>
                            </div>
                            
                            {/* Star badge for cover */}
                            {coverIndex === index && (
                               <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm z-10">
                                  <Star size={10} fill="currentColor" />
                               </div>
                            )}
                         </div>
                      ))}

                      {/* Add Button */}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 group">
                         <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                            <Plus size={20} />
                         </div>
                         <span className="text-xs font-bold">הוסף תמונות</span>
                      </label>
                   </div>
                   <p className="text-xs text-slate-400">
                      * התמונה הראשית היא זו שתופיע בתוצאות החיפוש. מומלץ להעלות לפחות 3 תמונות מזוויות שונות.
                      <br/>* תומך ב-JPG, PNG עד 5MB.
                   </p>
                </div>

                {/* 2. Basic Info */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                   <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <Type size={20} className="text-purple-500" />
                      פרטים בסיסיים
                   </h2>

                   <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">שם המוצר</label>
                      <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold"
                        placeholder="לדוגמה: Super Dashboard UI Kit"
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">תיאור המוצר</label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-medium min-h-[150px] leading-relaxed resize-y"
                        placeholder="תאר את המוצר שלך. מה הוא כולל? למי הוא מתאים? מה הפורמטים הכלולים?"
                      />
                   </div>
                </div>

                {/* 3. Detailed Features & Includes */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                   
                   {/* Features */}
                   <div className="space-y-4">
                      <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
                         <List size={20} className="text-emerald-500" />
                         פיצ'רים מרכזיים
                      </label>
                      <p className="text-xs text-slate-400 -mt-2">נקודות חוזקה עיקריות (לדוגמה: "עיצוב רספונסיבי", "תמיכה ב-Dark Mode")</p>
                      
                      <div className="flex flex-col gap-2">
                         {features.map(feat => (
                            <div key={feat} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                               <Check size={14} className="text-emerald-500 shrink-0" />
                               <span className="text-sm font-medium flex-1">{feat}</span>
                               <button onClick={() => removeItem(feat, features, setFeatures)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                            </div>
                         ))}
                         <input 
                           value={currentFeature}
                           onChange={(e) => setCurrentFeature(e.target.value)}
                           onKeyDown={(e) => handleAddItem(e, currentFeature, setCurrentFeature, features, setFeatures)}
                           className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                           placeholder="הקלד פיצ'ר ולחץ Enter..."
                         />
                      </div>
                   </div>

                   {/* What's Included */}
                   <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
                         <Box size={20} className="text-blue-500" />
                         מה כלול בחבילה?
                      </label>
                      <p className="text-xs text-slate-400 -mt-2">רשימת תכולה (לדוגמה: "20 מסכי מובייל", "קובץ גופנים")</p>
                      
                      <div className="flex flex-col gap-2">
                         {includes.map(inc => (
                            <div key={inc} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                               <Box size={14} className="text-blue-500 shrink-0" />
                               <span className="text-sm font-medium flex-1">{inc}</span>
                               <button onClick={() => removeItem(inc, includes, setIncludes)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                            </div>
                         ))}
                         <input 
                           value={currentInclude}
                           onChange={(e) => setCurrentInclude(e.target.value)}
                           onKeyDown={(e) => handleAddItem(e, currentInclude, setCurrentInclude, includes, setIncludes)}
                           className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                           placeholder="הקלד פריט ולחץ Enter..."
                         />
                      </div>
                   </div>

                </div>

             </div>

             {/* RIGHT COLUMN - Settings */}
             <div className="space-y-6">
                
                {/* Price & Category */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                   <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">מחיר (₪)</label>
                      <div className="relative">
                         <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                           type="number"
                           min="0"
                           value={price}
                           onChange={(e) => setPrice(e.target.value)}
                           className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-lg"
                           placeholder="0"
                         />
                      </div>
                      <p className="text-xs text-slate-400">השאר 0 כדי להציע בחינם.</p>
                   </div>

                   <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">קטגוריה</label>
                      <div className="relative">
                         <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <select 
                           value={category}
                           onChange={(e) => setCategory(e.target.value as Category)}
                           className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold appearance-none cursor-pointer"
                         >
                            {CATEGORIES.filter(c => c !== 'הכל').map(c => (
                               <option key={c} value={c}>{c}</option>
                            ))}
                         </select>
                      </div>
                   </div>
                </div>

                {/* Formats Selection */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                   <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText size={18} />
                      פורמטים כלולים
                   </label>
                   
                   <div className="flex flex-wrap gap-2">
                      {COMMON_FORMATS.map(fmt => {
                         const isSelected = selectedFormats.includes(fmt);
                         return (
                            <button
                               key={fmt}
                               onClick={() => toggleFormat(fmt)}
                               className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  isSelected 
                                  ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                               }`}
                            >
                               {fmt}
                            </button>
                         );
                      })}
                   </div>
                </div>

                {/* Tags */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                   <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Tag size={18} />
                      תגיות
                   </label>
                   
                   <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map(tag => (
                         <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-1 group">
                            {tag}
                            <button onClick={() => removeItem(tag, tags, setTags)} className="hover:text-red-500"><X size={12} /></button>
                         </span>
                      ))}
                   </div>

                   <input 
                     value={currentTag}
                     onChange={(e) => setCurrentTag(e.target.value)}
                     onKeyDown={(e) => handleAddItem(e, currentTag, setCurrentTag, tags, setTags)}
                     className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                     placeholder="הקלד תגית ולחץ Enter..."
                   />
                </div>

                {/* Product File Upload */}
                <div className={`p-6 rounded-[2rem] border-2 border-dashed transition-all ${productFile ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-100 hover:border-blue-300'}`}>
                   <div className="flex flex-col items-center justify-center text-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${productFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-blue-500'}`}>
                         {productFile ? <Check size={24} /> : <FileText size={24} />}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-800">
                           {productFile ? 'הקובץ נבחר בהצלחה' : 'קובץ המוצר (להורדה)'}
                         </h3>
                         <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                            {productFile 
                              ? `${productFile.name} (${(productFile.size / 1024 / 1024).toFixed(2)} MB)`
                              : 'ZIP, FIG, SKETCH (עד 50MB)'
                            }
                         </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <label className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors border cursor-pointer ${
                          productFile 
                          ? 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white'
                        }`}>
                            {productFile ? 'החלף קובץ' : 'בחר קובץ'}
                            <input type="file" onChange={handleProductFileChange} className="hidden" />
                        </label>
                        
                        {productFile && (
                          <button 
                            onClick={() => setProductFile(null)}
                            className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"
                          >
                             <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                   </div>
                </div>

             </div>

          </div>
       </div>

    </div>
  );
};