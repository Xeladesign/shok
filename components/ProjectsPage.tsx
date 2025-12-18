import React, { useState } from 'react';
import { Clock, Briefcase, Filter, ArrowRight, MapPin, Calendar, DollarSign, CheckCircle2, ChevronLeft, Share2, Bookmark, Send } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  category: string;
  budget: string;
  type: string;
  description: string;
  fullDescription?: string;
  client: string;
  clientAvatar?: string;
  postedAt: string;
  tags: string[];
  location?: string;
  requirements?: string[];
}

interface ProjectsPageProps {
  onOpenCreate: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onOpenCreate }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeFilter, setActiveFilter] = useState('הכל');

  // Extended Mock Data
  const projects: Project[] = [
    {
       id: 1,
       title: 'עיצוב אתר איקומרס',
       category: 'UI/UX Design',
       budget: '8,000+',
       type: 'פרויקט',
       description: 'עיצוב מחדש לחנות אופנה. דרוש נסיון ב-Figma.',
       fullDescription: 'אנחנו מחפשים מעצב UI מוכשר לעיצוב מחדש של חנות אופנה אינטרנטית מובילה. הפרויקט כולל אפיון מחדש של חווית המשתמש, עיצוב דף הבית, דפי קטגוריה, דף מוצר, ועגלת קניות. אנחנו עובדים עם Figma ומחפשים מישהו שיודע לייצר עיצוב נקי, מינימליסטי ויוקרתי. דגש חזק על חווית מובייל (Mobile First).',
       client: 'סטודיו נועה',
       postedAt: '2 שע׳',
       tags: ['Figma', 'Ecommerce'],
       location: 'תל אביב',
       requirements: [
         'נסיון של 3 שנים לפחות בעיצוב UI/UX',
         'שליטה מלאה ב-Figma ו-Auto Layout',
         'נסיון מוכח באתרי איקומרס (חובה לצרף תיק עבודות)',
         'יכולת עבודה עצמאית ועמידה בלוחות זמנים'
       ]
    },
    {
       id: 2,
       title: 'דף נחיתה באלמנטור',
       category: 'WordPress',
       budget: '2,000',
       type: 'דחוף',
       description: 'הקמת דף נחיתה לפי עיצוב קיים בפיגמה.',
       fullDescription: 'יש לנו עיצוב מוכן בפיגמה לדף נחיתה שיווקי. אנחנו צריכים מישהו שייקח את העיצוב ויבנה אותו באלמנטור פרו בצורה מדויקת (Pixel Perfect). הדף צריך להיות קל משקל, מהיר ורספונסיבי לחלוטין.',
       client: 'דיגיטל בוסט',
       postedAt: '5 שע׳',
       tags: ['Elementor', 'CSS'],
       location: 'מהבית',
       requirements: [
         'שליטה באלמנטור פרו',
         'ידע ב-HTML/CSS להתאמות אישיות',
         'זמינות להתחלה מיידית (היום/מחר)'
       ]
    },
    {
       id: 3,
       title: 'מיתוג לסטארטאפ',
       category: 'Branding',
       budget: '5,000',
       type: 'מיתוג',
       description: 'שפה עיצובית חדשנית לחברת סייבר.',
       fullDescription: 'חברת CyberShield עוסקת באבטחת מידע לעסקים קטנים. אנחנו מחפשים מעצב מותג שיבנה לנו זהות ויזואלית שתשדר: אמינות, חדשנות וטכנולוגיה. התוצרים הנדרשים: לוגו, פלטת צבעים, טיפוגרפיה ועיצוב כרטיס ביקור.',
       client: 'CyberShield',
       postedAt: '1 יום',
       tags: ['Branding', 'Logo'],
       location: 'הרצליה',
       requirements: [
         'נסיון במיתוג לחברות טכנולוגיה',
         'יכולת חשיבה קונספטואלית',
         'העברת קבצים וקטוריים מסודרים'
       ]
    },
    {
       id: 4,
       title: 'אנימציית לוגו',
       category: 'Animation',
       budget: '1,200',
       type: 'Lottie',
       description: 'הנפשת לוגו קיים ל-Lottie עבור אפליקציה.',
       fullDescription: 'יש לנו לוגו וקטורי קיים. אנחנו רוצים להנפיש אותו בצורה חלקה ומעניינת שתשמש כמסך טעינה (Loader) באפליקציה החדשה שלנו. האנימציה צריכה להיות לולאתית (Loop) ובפורמט Lottie/JSON.',
       client: 'Appy',
       postedAt: '1 יום',
       tags: ['After Effects', 'Lottie'],
       location: 'מהבית',
       requirements: [
         'שליטה ב-After Effects ו-Bodymovin',
         'נסיון ביצירת אנימציות Lottie',
         'תיק עבודות עם דוגמאות לאנימציה'
       ]
    },
    {
       id: 5,
       title: 'עיצוב אפליקציה',
       category: 'UI/UX Design',
       budget: '12,000',
       type: 'פרויקט',
       description: 'אפיון ועיצוב לאפליקציית כושר ותזונה.',
       fullDescription: 'דרוש מעצב UI/UX מנוסה לעיצוב אפליקציית מובייל (iOS/Android) בתחום הכושר. העבודה כוללת כ-20 מסכים, כולל מסכי הרשמה, דאשבורד, מעקב אימונים ופרופיל אישי.',
       client: 'FitLife',
       postedAt: 'יומיים',
       tags: ['Mobile App', 'Figma'],
       location: 'רמת גן',
       requirements: [
         'נסיון מוכח בעיצוב אפליקציות',
         'יכולת בניית Design System',
         'הבנה ב-Human Interface Guidelines'
       ]
    },
  ];

  const filteredProjects = activeFilter === 'הכל' 
    ? projects 
    : projects.filter(p => p.category.includes(activeFilter) || p.type.includes(activeFilter));

  // --- Project Details View ---
  if (selectedProject) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-1 pb-20 animate-fadeIn">
         {/* Navigation Bar */}
         <div className="flex items-center justify-between mb-6 px-2">
            <button 
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm group"
            >
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               <span className="font-bold text-sm">חזרה ללוח</span>
            </button>

            <div className="flex gap-2">
               <button className="p-2.5 text-slate-400 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <Share2 size={18} />
               </button>
               <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <Bookmark size={18} />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* Header Card */}
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                     <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedProject.category}</span>
                     <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold">{selectedProject.type}</span>
                     <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Clock size={12} /> {selectedProject.postedAt}
                     </span>
                  </div>

                  <h1 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                     {selectedProject.title}
                  </h1>

                  <div className="flex flex-wrap gap-6 border-t border-slate-50 pt-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                           <DollarSign className="text-slate-600" size={20} />
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-400 uppercase">תקציב</div>
                           <div className="font-black text-slate-800 text-lg dir-ltr">₪{selectedProject.budget}</div>
                        </div>
                     </div>
                     <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                           <MapPin className="text-slate-600" size={20} />
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-400 uppercase">מיקום</div>
                           <div className="font-bold text-slate-800">{selectedProject.location || 'לא צוין'}</div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Description */}
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">אודות הפרויקט</h3>
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                     <p>{selectedProject.fullDescription || selectedProject.description}</p>
                  </div>

                  {selectedProject.requirements && (
                     <div className="mt-8">
                        <h4 className="font-bold text-slate-900 mb-4">דרישות חובה</h4>
                        <ul className="space-y-3">
                           {selectedProject.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                                 <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                 <span className="text-slate-700 font-medium text-sm">{req}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-slate-50">
                     <h4 className="font-bold text-slate-900 mb-3">תגיות</h4>
                     <div className="flex flex-wrap gap-2">
                        {selectedProject.tags.map(tag => (
                           <span key={tag} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">#{tag}</span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
               {/* Client Card */}
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">פורסם על ידי</h3>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                        <img 
                           src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProject.client)}&background=random`} 
                           alt={selectedProject.client}
                           className="w-full h-full object-cover" 
                        />
                     </div>
                     <div>
                        <div className="font-bold text-slate-900 text-lg">{selectedProject.client}</div>
                        <div className="text-sm text-slate-500">מאומת • 12 פרויקטים</div>
                     </div>
                  </div>
                  <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors text-sm">
                     צפה בפרופיל
                  </button>
               </div>

               {/* Apply Action */}
               <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>
                  
                  <h3 className="text-xl font-bold mb-2 relative z-10">מעוניין בפרויקט?</h3>
                  <p className="text-slate-400 text-sm mb-6 relative z-10">שלח הצעה מסודרת ללקוח והגדל את הסיכויים שלך לזכות.</p>
                  
                  <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 relative z-10 active:scale-95">
                     <Send size={18} />
                     הגש הצעה לפרויקט
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- Projects List View ---
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-1 pb-20">
       
       {/* Header Section */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2 mt-4">
          <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">לוח פרויקטים</h2>
             <p className="text-slate-500">מצא את האתגר הבא שלך או פרסם פרויקט חדש</p>
          </div>
          <button 
             onClick={onOpenCreate}
             className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2"
          >
             <Briefcase size={18} />
             פרסם פרויקט
          </button>
       </div>

       {/* Filters */}
       <div className="flex gap-2 overflow-x-auto pb-6 px-1 mb-2 no-scrollbar">
          {['הכל', 'UI/UX', 'WordPress', 'Branding', 'Animation'].map((filter, i) => (
             <button 
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                 activeFilter === filter 
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                 : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
               }`}
             >
                {filter}
             </button>
          ))}
       </div>

       {/* Projects Grid - 4 Columns */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
          {filteredProjects.map((project) => (
             <div 
               key={project.id} 
               onClick={() => setSelectedProject(project)}
               className="group cursor-pointer pt-6 select-none"
             >
                <div className="relative">
                    {/* Folder Tab (Top Left for RTL) */}
                    <div className="absolute -top-4 right-0 w-24 h-6 bg-blue-50 rounded-t-lg border-t border-r border-l border-blue-100 z-0"></div>
                    
                    {/* Main Folder Body */}
                    <div className="relative bg-white rounded-xl rounded-tr-none border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 z-10 p-5 flex flex-col h-[280px]">
                        
                        {/* Top: Category & Urgency */}
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                {project.category}
                            </span>
                             {project.type === 'דחוף' && (
                                <span className="bg-red-50 text-red-500 px-2 py-1 rounded-md text-[10px] font-bold animate-pulse">
                                    דחוף
                                </span>
                             )}
                        </div>

                        {/* Title & Description */}
                        <div className="mb-auto">
                             <h3 className="text-lg font-black text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {project.title}
                             </h3>
                             <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                                {project.description}
                             </p>
                        </div>

                        {/* Tags */}
                        <div className="flex gap-1.5 flex-wrap my-4">
                            {project.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Footer: Budget & Client */}
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden">
                                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.client)}&background=random`} alt={project.client} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[80px]">{project.client}</span>
                             </div>
                             <div className="text-right">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">תקציב</span>
                                <span className="block text-sm font-black text-slate-900 dir-ltr">₪{project.budget}</span>
                             </div>
                        </div>

                    </div>

                    {/* Stacked Paper Effect behind folder */}
                    <div className="absolute inset-0 bg-white rounded-xl border border-slate-200 -z-10 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300"></div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};