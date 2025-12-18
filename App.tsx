import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { Sidebar } from './components/Sidebar';
import { AISearchModal } from './components/AISearchModal';
import { AuthModal } from './components/AuthModal';
import { DatabaseSetup } from './components/DatabaseSetup';
import { ProductDetails } from './components/ProductDetails';
import { CreateProductPage } from './components/CreateProductPage'; 
import { CreateProjectModal } from './components/CreateProjectModal'; 
import { CreationSelectionModal } from './components/CreationSelectionModal'; 
import { CreatorOnboarding } from './components/CreatorOnboarding'; 
import { ProjectsPage } from './components/ProjectsPage'; 
import { ProfilePage } from './components/ProfilePage'; 
import { CreatorsHub } from './components/CreatorsHub'; 
import { AnalyticsDashboard } from './components/AnalyticsDashboard'; 
import { ChatPopup } from './components/ChatPopup';
import { AdminHubDashboard } from './components/AdminHubDashboard';
import { NotepadPage } from './components/NotepadPage';
import { CanvasPage } from './components/CanvasPage';
import { Category, Product } from './types';
import { CATEGORIES } from './constants';
import { supabase } from './services/supabase';
import { Database, Wifi, WifiOff, Settings, MessageCircle } from 'lucide-react';
import gsap from 'gsap';

const ADMIN_EMAIL = 'alexivanov4425@gmail.com';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // App State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<any>(null);

  // Creation Modals State
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false); 
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false); 

  const [isCreatorOnboardingOpen, setIsCreatorOnboardingOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('הכל');
  const [currentView, setCurrentView] = useState<'home' | 'projects' | 'profile' | 'creators' | 'create-product' | 'analytics' | 'admin-hub' | 'notepad' | 'canvas'>('home'); 
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile View State
  const [viewedProfile, setViewedProfile] = useState<any>(null);

  // Data State
  const [products, setProducts] = useState<Product[]>([]); 
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error' | 'connected-no-data'>('connecting');
  const [dbError, setDbError] = useState<string>('');
  const [keyWarning, setKeyWarning] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Animation Ref
  const homeRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.email && (user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim());
  const isDarkMode = currentView === 'creators' || currentView === 'canvas';

  useEffect(() => {
    const handleOpenLogin = () => setIsAuthModalOpen(true);
    document.addEventListener('open-login', handleOpenLogin);
    return () => document.removeEventListener('open-login', handleOpenLogin);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
         setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url
        });
      } else {
        setUser(null);
      }
    });

    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  useLayoutEffect(() => {
    if (currentView === 'home' && !selectedProduct && homeRef.current) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from('.gsap-filter-bar', { y: -20, opacity: 0, duration: 1.2 });
        tl.from('.gsap-home-header', { y: 20, opacity: 0, duration: 1.2 }, '<0.1');
        const gridItems = gsap.utils.toArray('.gsap-product-grid > div > div');
        if (gridItems.length > 0) {
            tl.fromTo(gridItems, 
              { y: 60, opacity: 0, scale: 0.95 },
              { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.06, ease: 'power3.out', clearProps: 'opacity,transform,scale' }, '<0.1'
            );
        } else {
            tl.from('.gsap-product-grid', { y: 30, opacity: 0, duration: 1.2 }, '<0.1');
        }
      }, homeRef);
      return () => ctx.revert();
    }
  }, [currentView, selectedProduct, products]);

  const fetchProducts = async () => {
    // @ts-ignore
    const key = (supabase as any).supabaseKey || '';
    if (key && !key.startsWith('eyJ') && !key.startsWith('sb_')) setKeyWarning(true);

    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Supabase connected but required tables missing. Opening setup.');
          setDbStatus('connected-no-data');
          setProducts([]); 
          setIsSetupOpen(true); 
        } else {
          console.warn('Supabase fetch error:', error.message);
          setDbStatus('error');
          setDbError(error.message); 
        }
      } else {
        if (data && data.length > 0) {
          setProducts(data as Product[]);
          setDbStatus('connected');
        } else {
           setDbStatus('connected-no-data');
           setProducts([]);
        }
        setDbError('');
      }
    } catch (err: any) {
      console.error('Failed to connect to Supabase:', err);
      setDbStatus('error');
      setDbError(err.message || 'Unknown network error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) { alert('Access Denied: You are not an admin.'); return; }
    setDeletingId(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        alert('DELETE FAILED: ' + error.message);
        console.error("Supabase Delete Error:", error);
      } else {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err: any) {
      console.error("Unknown Error:", err);
      alert('Delete failed unexpectedly: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleApplySearch = (term: string) => setSearchQuery(term);
  const handleLogin = (userData: any) => setUser(userData);
  const handleSignup = (userData: any) => { setUser(userData); setIsCreatorOnboardingOpen(true); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setCurrentView('home'); setViewedProfile(null); };
  const handleProductClick = (product: Product) => setSelectedProduct(product);
  const handleBackToGrid = () => setSelectedProduct(null);
  
  const handleOpenCreate = () => {
    if (!user) setIsAuthModalOpen(true);
    else setIsSelectionModalOpen(true); 
  };

  const handleOpenCreatorOnboarding = () => {
    if (!user) setIsAuthModalOpen(true);
    else setIsCreatorOnboardingOpen(true);
  };
  
  const handleSelectView = (view: 'home' | 'projects' | 'profile' | 'creators' | 'analytics' | 'admin-hub' | 'notepad' | 'canvas') => {
    setSelectedProduct(null); 
    if (view === 'profile' && user) setViewedProfile(user); 
    setCurrentView(view);
  };

  const handleOpenChat = (recipient?: any) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    if (recipient) setChatRecipient(recipient);
    setIsChatOpen(true);
  };

  const handleAuthorClick = async (authorName: string) => {
    if (user && user.name === authorName) {
        setViewedProfile(user);
        setCurrentView('profile');
        setSelectedProduct(null);
        return;
    }
    try {
        const { data } = await supabase.from('users').select('*').ilike('name', authorName).limit(1).single();
        if (data) {
            setViewedProfile({
                id: data.id,
                email: data.email,
                name: data.name,
                avatar: data.avatar_url,
                role: data.role
            });
            setCurrentView('profile');
            setSelectedProduct(null);
        } else {
             setViewedProfile({ id: 'mock', name: authorName, avatar: null, role: 'freelancer' });
             setCurrentView('profile');
             setSelectedProduct(null);
        }
    } catch (e) {
        console.error("Error finding author", e);
    }
  };

  const renderContent = () => {
    if (currentView === 'admin-hub' && isAdmin) return <AdminHubDashboard user={user} />;
    if (currentView === 'analytics' && user) return <AnalyticsDashboard user={user} />;
    if (currentView === 'notepad') return <NotepadPage />;
    if (currentView === 'canvas') return <CanvasPage />;
    if (currentView === 'create-product') return <CreateProductPage onBack={() => setCurrentView('home')} user={user} onProductCreated={() => { fetchProducts(); setCurrentView('home'); }} />;
    if (selectedProduct) {
      return <ProductDetails product={selectedProduct} onBack={handleBackToGrid} onAuthorClick={handleAuthorClick} user={user} onOpenLogin={() => setIsAuthModalOpen(true)} onOpenChat={handleOpenChat} />;
    }
    if (currentView === 'profile') {
      return <ProfilePage user={viewedProfile || user} isOwnProfile={user && viewedProfile && user.id === viewedProfile.id} onOpenChat={handleOpenChat} />;
    }
    if (currentView === 'projects') return <ProjectsPage onOpenCreate={handleOpenCreate} />;
    if (currentView === 'creators') return <CreatorsHub />;
    return (
      <div ref={homeRef} className="h-full overflow-y-auto custom-scrollbar pb-24 md:pb-20 pr-1 pl-1 pt-2 md:pt-4 space-y-4 md:space-y-6">
        <div id="products" className="min-h-[500px]">
           <div className="gsap-filter-bar flex items-center gap-2 overflow-x-auto pb-4 pt-1 px-2 md:px-4 no-scrollbar mask-gradient-right sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm transition-all">
             {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat as Category)} className={`px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' : 'bg-white text-slate-500 border border-slate-100 hover:border-blue-200 hover:text-blue-600 hover:bg-white'}`}>{cat}</button>
             ))}
          </div>
          <div className="gsap-home-header flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 px-2 md:px-4 gap-4">
            <div className="flex items-center gap-4">
               <div className="relative"><h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{activeCategory === 'הכל' ? 'נכסים אחרונים' : activeCategory}</h2></div>
               <span className="text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">{products.length} זמינים</span>
            </div>
          </div>
          <div className="gsap-product-grid px-1 md:px-2">
             {products.length === 0 && dbStatus !== 'connecting' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm"><Database size={32} className="text-slate-400" /></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">אין עדיין מוצרים</h3>
                    <button onClick={handleOpenCreate} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">+ הוסף מוצר ראשון</button>
                </div>
             ) : (
                <ProductGrid products={products} searchQuery={searchQuery} activeCategory={activeCategory} onProductClick={handleProductClick} isAdmin={!!isAdmin} onDeleteProduct={handleDeleteProduct} deletingId={deletingId} onAuthorClick={handleAuthorClick} user={user} onOpenLogin={() => setIsAuthModalOpen(true)} />
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 w-full h-[100dvh] flex flex-col md:flex-row overflow-hidden font-sans p-2 md:p-4 gap-2 md:gap-4 relative transition-colors duration-500 ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-[#F8FAFC] text-slate-800'}`} dir="rtl">
      <div className={`fixed inset-0 dot-grid-pattern pointer-events-none z-0 transition-opacity duration-500 ${isDarkMode ? 'opacity-5' : 'opacity-40'}`}></div>
      <div className={`fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-opacity duration-500 ${isDarkMode ? 'opacity-20' : 'opacity-100'}`}>
         <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[120px] opacity-60"></div>
         <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[120px] opacity-60"></div>
         <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-pink-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"></div>
      </div>

      <div className="fixed bottom-4 left-4 z-40 group/status flex items-center gap-2 scale-90 origin-bottom-left md:scale-100 hidden md:flex">
         <div className={`flex items-center gap-3 px-4 py-2 border rounded-full shadow-lg hover:shadow-xl transition-all cursor-default ${isDarkMode ? 'bg-black/50 border-white/10 backdrop-blur-xl' : 'bg-white/80 border-slate-200 backdrop-blur-xl hover:bg-white'} ${dbStatus === 'error' ? 'border-red-500/30' : ''}`}>
            <div className="relative">
                <Database size={14} className={`transition-colors ${dbStatus === 'error' ? 'text-red-400' : isDarkMode ? 'text-gray-400 group-hover/status:text-gray-200' : 'text-slate-400 group-hover/status:text-slate-600'}`} />
                <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border-2 ${isDarkMode ? 'border-[#141414]' : 'border-white'} ${dbStatus.startsWith('connected') ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            </div>
            <div className={`h-3 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            <div className="flex items-center gap-1.5">
                {dbStatus.startsWith('connected') ? <Wifi size={12} className="text-emerald-500" /> : dbStatus === 'error' ? <WifiOff size={12} className="text-red-500" /> : <div className="w-3 h-3 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>}
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dbStatus.startsWith('connected') ? 'text-emerald-600' : dbStatus === 'error' ? 'text-red-500' : 'text-yellow-600'}`}>{dbStatus === 'connected' ? 'Supabase' : dbStatus === 'connected-no-data' ? 'Connected (Empty)' : dbStatus === 'error' ? 'Failed' : 'Connecting...'}</span>
            </div>
         </div>
         <button onClick={() => setIsSetupOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 animate-fadeIn" title="Database Setup & Tools"><Settings size={14} /><span className="text-xs font-bold hidden md:inline">DB Setup</span></button>
      </div>

      {/* Floating Chat Trigger - if popup is closed */}
      {!isChatOpen && user && (
          <button 
            onClick={() => handleOpenChat()}
            className="fixed bottom-4 left-4 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-bounceIn"
          >
             <MessageCircle size={28} />
          </button>
      )}

      {/* Chat Popup */}
      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        currentUser={user} 
        recipientUser={chatRecipient} 
      />

      <div className="hidden md:block h-full shrink-0 z-30">
        <Sidebar activeCategory={activeCategory} onSelectCategory={(cat) => { setActiveCategory(cat); setSelectedProduct(null); }} currentView={currentView as any} onSelectView={handleSelectView} user={user} onLogout={handleLogout} onOpenCreatorOnboarding={handleOpenCreatorOnboarding} isProductDetailsOpen={!!selectedProduct} isDarkMode={isDarkMode} onOpenCreate={handleOpenCreate} />
      </div>

      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
          <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className={`absolute top-0 right-0 h-full transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
             <Sidebar activeCategory={activeCategory} onSelectCategory={(cat) => { setActiveCategory(cat); setSelectedProduct(null); }} currentView={currentView as any} onSelectView={handleSelectView} user={user} onLogout={handleLogout} isMobile={true} onClose={() => setIsMobileMenuOpen(false)} onOpenCreatorOnboarding={() => { setIsMobileMenuOpen(false); handleOpenCreatorOnboarding(); }} isDarkMode={isDarkMode} onOpenCreate={handleOpenCreate} />
          </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 gap-3 md:gap-4 h-full relative z-10">
        <Header onOpenAISearch={() => setIsAIModalOpen(true)} searchQuery={searchQuery} setSearchQuery={(q) => { setSearchQuery(q); if (selectedProduct) setSelectedProduct(null); }} user={user} onOpenLogin={() => setIsAuthModalOpen(true)} onMenuClick={() => setIsMobileMenuOpen(true)} onOpenCreate={handleOpenCreate} isDarkMode={isDarkMode} onLogout={handleLogout} onProfileClick={() => handleSelectView('profile')} onOpenChat={handleOpenChat} />
        <main className={`flex-1 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] relative transition-colors duration-500 ${isDarkMode ? 'bg-[#141414]' : ''}`}>{renderContent()}</main>
      </div>

      <AISearchModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onApplySearch={handleApplySearch} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onSignup={handleSignup} />
      <CreationSelectionModal isOpen={isSelectionModalOpen} onClose={() => setIsSelectionModalOpen(false)} onSelectProduct={() => { setIsSelectionModalOpen(false); setCurrentView('create-product'); }} onSelectProject={() => { setIsSelectionModalOpen(false); setIsCreateProjectModalOpen(true); }} />
      <CreateProjectModal isOpen={isCreateProjectModalOpen} onClose={() => setIsCreateProjectModalOpen(false)} user={user} onProjectCreated={() => { setCurrentView('projects'); }} />
      <CreatorOnboarding isOpen={isCreatorOnboardingOpen} onClose={() => setIsCreatorOnboardingOpen(false)} user={user} onComplete={() => { setIsCreatorOnboardingOpen(false); setIsSelectionModalOpen(true); }} />
      <DatabaseSetup isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
    </div>
  );
};

export default App;