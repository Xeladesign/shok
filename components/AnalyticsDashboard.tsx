import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Product } from '../types';
import { 
  BarChart3, Eye, Download, MessageSquare, TrendingUp, 
  DollarSign, Package, AlertCircle, Loader2, ArrowUpRight
} from 'lucide-react';

interface AnalyticsDashboardProps {
  user: any;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalComments: 0
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Products
      const { data: userProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('author', user.name) // Assuming author matches name as per creation logic
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      if (!userProducts || userProducts.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Comments for these products
      const productIds = userProducts.map(p => p.id);
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('product_id', productIds);

      // 3. Calculate Totals
      const totalViews = userProducts.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalDownloads = userProducts.reduce((sum, p) => sum + (p.downloads || 0), 0);
      const totalSales = userProducts.reduce((sum, p) => sum + (p.sales || 0), 0);
      
      // Calculate Revenue (Price * Sales) - simplified estimate
      const totalRevenue = userProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.sales || 0)), 0);

      setProducts(userProducts as Product[]);
      setStats({
        totalViews,
        totalSales: totalSales + totalDownloads, // Combine for general "actions"
        totalRevenue,
        totalComments: commentsCount || 0
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-2 md:p-6 space-y-8 animate-fadeIn">
       
       {/* Header */}
       <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">לוח בקרה ואנליטיקס</h1>
          <p className="text-slate-500">סקירה כללית על ביצועי החנות והמוצרים שלך</p>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Eye size={80} className="text-blue-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-sm">
                      <Eye size={18} />
                      <span>צפיות במוצרים</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-1">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">סה"כ כניסות לדפי המוצר</div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Download size={80} className="text-emerald-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-sm">
                      <Download size={18} />
                      <span>הורדות / מכירות</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-1">{stats.totalSales.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">סה"כ פעולות רכישה והורדה</div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign size={80} className="text-purple-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-sm">
                      <DollarSign size={18} />
                      <span>הכנסות משוערות</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-1 flex items-baseline gap-1">
                      <span className="text-lg">₪</span>
                      {stats.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">לפני עמלת פלטפורמה (30%)</div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageSquare size={80} className="text-orange-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-orange-600 font-bold text-sm">
                      <MessageSquare size={18} />
                      <span>תגובות</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-1">{stats.totalComments.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">אינטראקציות משתמשים</div>
              </div>
          </div>

       </div>

       {/* Products Performance List */}
       <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Package className="text-slate-400" />
                ביצועי מוצרים
             </h2>
             <span className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                {products.length} מוצרים פעילים
             </span>
          </div>
          
          {products.length === 0 ? (
             <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <Package size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">אין נתונים להצגה</h3>
                <p className="text-slate-500 mb-6">העלה את המוצר הראשון שלך כדי לראות סטטיסטיקות.</p>
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-right">
                   <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                         <th className="px-6 py-4 rounded-tr-2xl">מוצר</th>
                         <th className="px-6 py-4">מחיר</th>
                         <th className="px-6 py-4">צפיות</th>
                         <th className="px-6 py-4">הורדות</th>
                         <th className="px-6 py-4">מכירות</th>
                         <th className="px-6 py-4">סה"כ הכנסות</th>
                         <th className="px-6 py-4 rounded-tl-2xl">סטטוס</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {products.map((product) => (
                         <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                     <img src={product.image} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                     <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{product.title}</div>
                                     <div className="text-xs text-slate-400">{product.category}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-sm font-bold text-slate-700">
                                  {product.price > 0 ? `₪${product.price}` : 'חינם'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <Eye size={14} className="text-slate-400" />
                                  {(product.views || 0).toLocaleString()}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <Download size={14} className="text-emerald-500" />
                                  {(product.downloads || 0).toLocaleString()}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <TrendingUp size={14} className="text-blue-500" />
                                  {(product.sales || 0).toLocaleString()}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-sm font-black text-slate-900 dir-ltr">
                                  ₪{((product.price || 0) * (product.sales || 0)).toLocaleString()}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  פעיל
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
       </div>
    </div>
  );
};