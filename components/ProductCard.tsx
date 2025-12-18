import React from 'react';
import { Product } from '../types';
import { Heart, ArrowDownToLine, Eye, Trash2, Loader2, Download, Lock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onAuthorClick?: (authorName: string) => void;
  user?: any;
  onOpenLogin?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onClick, 
  isAdmin, 
  onDelete, 
  isDeleting,
  onAuthorClick,
  user,
  onOpenLogin
}) => {
  
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAuthorClick) {
      onAuthorClick(product.author);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      if (onOpenLogin) onOpenLogin();
    } else {
      if (product.file_url) {
          window.open(product.file_url, '_blank');
      } else {
          alert("קובץ לא זמין להורדה (הועלה לפני העדכון האחרון)");
      }
    }
  };

  const isFree = product.price === 0;

  return (
    <div 
      onClick={() => onClick(product)}
      className={`group flex flex-col cursor-pointer select-none bg-white p-2.5 rounded-[2rem] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-blue-100/50 transition-all duration-500 ease-out hover:-translate-y-1 relative !opacity-100 ${isDeleting ? '!opacity-50 pointer-events-none' : ''}`}
    >
      
      {/* Admin Delete Button - ALWAYS VISIBLE if admin */}
      {isAdmin && onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`למחוק את ${product.title}?`)) {
              onDelete(product.id);
            }
          }}
          disabled={isDeleting}
          className="absolute -top-2 -right-2 z-50 p-2.5 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/20 hover:bg-red-600 hover:scale-110 transition-all disabled:bg-slate-400"
          title="Admin: Delete Project"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      )}

      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-slate-100 isolate">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Floating Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-20">
           {product.price === 0 && (
             <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg shadow-emerald-500/20 backdrop-blur-md">
               FREE
             </span>
           )}
           {product.category === 'ערכות UI' && (
             <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
               UI KIT
             </span>
           )}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 translate-y-4 group-hover:translate-y-0">
           {isFree ? (
              <button 
                onClick={handleDownloadClick}
                className="h-10 px-4 bg-emerald-500/90 backdrop-blur text-white font-bold rounded-xl flex items-center gap-1.5 hover:bg-emerald-500 transition-colors shadow-xl text-xs"
              >
                {user ? <Download size={14} /> : <Lock size={14} />}
                <span>{user ? 'הורדה' : 'התחבר'}</span>
              </button>
           ) : (
             <button className="h-10 px-4 bg-white/95 backdrop-blur text-slate-900 font-bold rounded-xl flex items-center gap-1.5 hover:bg-white transition-colors shadow-xl text-xs">
               <Eye size={14} />
               <span>סקירה</span>
             </button>
           )}
           
           <button 
             onClick={(e) => e.stopPropagation()}
             className="w-10 h-10 bg-white/95 backdrop-blur text-slate-900 rounded-xl flex items-center justify-center hover:text-red-500 transition-colors shadow-xl"
           >
             <Heart size={16} />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-1.5 pt-3 pb-1 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-[15px] truncate leading-tight group-hover:text-blue-600 transition-colors">
              {product.title}
            </h3>
            <button 
              onClick={handleAuthorClick}
              className="text-[11px] text-slate-400 font-medium truncate mt-0.5 hover:text-blue-600 hover:underline transition-colors text-right"
            >
              מאת {product.author}
            </button>
          </div>
          
          <div className="shrink-0">
             <span className="text-[13px] font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
               {product.price > 0 ? `₪${product.price}` : '0'}
             </span>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5 overflow-hidden">
             {product.tags?.slice(0, 1).map(tag => (
               <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md truncate">
                 #{tag}
               </span>
             ))}
          </div>
          
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
             <ArrowDownToLine size={12} />
             <span>{(product.downloads || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};