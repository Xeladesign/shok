import React, { useMemo } from 'react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { Layers } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  activeCategory: Category;
  searchQuery?: string;
  onProductClick: (product: Product) => void;
  isAdmin?: boolean;
  onDeleteProduct?: (id: string) => void;
  deletingId?: string | null;
  onAuthorClick?: (authorName: string) => void;
  user?: any;
  onOpenLogin?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  activeCategory, 
  searchQuery = '', 
  onProductClick,
  isAdmin,
  onDeleteProduct,
  deletingId,
  onAuthorClick,
  user,
  onOpenLogin
}) => {
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = activeCategory === 'הכל' || product.category === activeCategory;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 text-slate-400 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <Layers size={32} />
        </div>
        <h3 className="text-xl text-slate-800 font-bold mb-2">לא נמצאו פריטים</h3>
        <p className="text-slate-500 text-base">נסה לשנות את הסינון או חפש משהו אחר</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredProducts.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onClick={onProductClick}
          isAdmin={isAdmin}
          onDelete={onDeleteProduct}
          isDeleting={deletingId === product.id}
          onAuthorClick={onAuthorClick}
          user={user}
          onOpenLogin={onOpenLogin}
        />
      ))}
    </div>
  );
};