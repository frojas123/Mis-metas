import React, { useState, useEffect, useRef } from 'react';
import { Wish, Category, Importance } from './types';
import VisionBoardHero from './components/VisionBoardHero';
import WishCard from './components/WishCard';
import { generateWishImage, generateActionPlan, getApiKey } from './services/geminiService';
import { Plus, X, Loader2, Sparkles, Wallet, RefreshCw, Trophy, Target, BrainCircuit, LayoutGrid, ChevronDown, Wand2, Trash2, AlertTriangle, Fish, WifiOff, Wifi, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

function App() {
  // Start empty to force user to create
  const [wishes, setWishes] = useState<Wish[]>(() => {
    const saved = localStorage.getItem('my_luxury_wishes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  // Connection Status
  const [isOffline, setIsOffline] = useState(false);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  
  // Celebration State
  const [celebratingWish, setCelebratingWish] = useState<Wish | null>(null);

  // Delete Confirmation State
  const [wishToDelete, setWishToDelete] = useState<string | null>(null);

  // State for editing
  const [editingWishId, setEditingWishId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formCategory, setFormCategory] = useState<Category>(Category.OTHER);
  const [formImportance, setFormImportance] = useState<Importance>(Importance.MEDIUM);
  const [formImage, setFormImage] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlan, setFormPlan] = useState('');

  // Image Source Tab State
  const [imageTab, setImageTab] = useState<'ai' | 'manual'>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('my_luxury_wishes', JSON.stringify(wishes));
  }, [wishes]);

  // Check API Key on mount
  useEffect(() => {
    const key = getApiKey();
    setIsOffline(!key);
  }, []);

  // Paste Listener for Modal
  useEffect(() => {
    if (!showModal) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const blob = item.getAsFile();
            if (blob) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (result) {
                        setFormImage(result);
                        setImageTab('manual'); // Auto switch to manual to show the user what happened
                    }
                };
                reader.readAsDataURL(blob);
                e.preventDefault(); // Stop pasting into text inputs if it's an image
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showModal]);

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormCost('');
    setFormPrompt('');
    setFormCategory(Category.OTHER);
    setFormImportance(Importance.MEDIUM);
    setFormImage('');
    setFormDate('');
    setFormPlan('');
    setEditingWishId(null);
    setImageTab('ai');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (wish: Wish) => {
    setEditingWishId(wish.id);
    setFormTitle(wish.title);
    setFormDesc(wish.description);
    setFormCost(wish.targetAmount.toString());
    setFormCategory(wish.category);
    setFormImportance(wish.importance || Importance.MEDIUM);
    setFormImage(wish.imageUrl);
    setFormDate(wish.targetDate || '');
    setFormPlan(wish.actionPlan || '');
    setFormPrompt(''); 
    setImageTab('ai'); // Default to AI, but user can switch if they want to change image manually
    setShowModal(true);
  };

  const handleRegenerateImage = async () => {
     // Check if we have enough info to generate
     const promptToUse = formPrompt || formDesc || formTitle;
     
     if (!promptToUse) {
         alert("Ingresa un título, descripción o prompt personalizado para generar la imagen.");
         return;
     }
     
     setRegeneratingImage(true);
     setFormImage(''); // Clear current image to show loading state better

     try {
         // Generate image first
         const newImage = await generateWishImage(promptToUse, true);
         
         // Add a small artificial delay so the user sees the spinner 
         // (important if fallback returns instantly, prevents "flicker")
         await new Promise(resolve => setTimeout(resolve, 800));
         
         setFormImage(newImage);
     } catch (e) {
         console.error("Failed to regenerate image", e);
         // Even in total failure, try to set something or alert
         alert("No se pudo generar la imagen. Verifica tu conexión.");
     } finally {
         setRegeneratingImage(false);
     }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Check size? Optional.
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                setFormImage(result);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleGeneratePlan = async () => {
    if (!formTitle || !formCost) {
        alert("Por favor ingresa un título y costo primero.");
        return;
    }
    setGeneratingPlan(true);
    try {
        const plan = await generateActionPlan(formTitle, parseFloat(formCost));
        setFormPlan(plan);
    } catch (e) {
        console.error(e);
    } finally {
        setGeneratingPlan(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCost) return;

    setLoading(true);
    
    try {
        let finalImageUrl = formImage;

        // Generate image if it's a new wish or if user cleared the image (and didn't manually regenerate)
        // If formImage is already set (by manual regeneration OR upload), we skip this.
        if (!finalImageUrl) {
            const imagePrompt = formPrompt || formDesc || formTitle;
            finalImageUrl = await generateWishImage(imagePrompt);
        }
        
        if (editingWishId) {
            // Update existing
            setWishes(prev => prev.map(w => {
                if (w.id === editingWishId) {
                    return {
                        ...w,
                        title: formTitle,
                        description: formDesc,
                        targetAmount: parseFloat(formCost),
                        category: formCategory,
                        importance: formImportance,
                        imageUrl: finalImageUrl,
                        targetDate: formDate,
                        actionPlan: formPlan
                    };
                }
                return w;
            }));
        } else {
            // Create new
            const newWish: Wish = {
                id: crypto.randomUUID(),
                title: formTitle,
                description: formDesc,
                targetAmount: parseFloat(formCost),
                savedAmount: 0,
                imageUrl: finalImageUrl,
                category: formCategory,
                importance: formImportance,
                createdAt: Date.now(),
                isCompleted: false,
                targetDate: formDate,
                actionPlan: formPlan
            };
            setWishes(prev => [newWish, ...prev]);
        }

        resetForm();
        setShowModal(false);
    } catch (error) {
        console.error("Failed to save wish", error);
        alert("Hubo un error al guardar. Revisa la consola para más detalles.");
    } finally {
        setLoading(false);
    }
  };

  const handleAddSavings = (id: string, amount: number) => {
    setWishes(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, savedAmount: Math.min(w.savedAmount + amount, w.targetAmount) };
      }
      return w;
    }));
  };

  // Triggers the deletion modal
  const requestDelete = (id: string) => {
    setWishToDelete(id);
  };

  // Executes the deletion
  const confirmDelete = () => {
    if (wishToDelete) {
        setWishes(prev => prev.filter(w => w.id !== wishToDelete));
        setWishToDelete(null);
    }
  };

  const handleComplete = (id: string) => {
    const wish = wishes.find(w => w.id === id);
    if (wish) {
        setCelebratingWish(wish);
        setWishes(prev => prev.map(w => w.id === id ? { ...w, isCompleted: true } : w));
    }
  };

  // Filter Logic
  const filteredWishes = selectedCategory === 'TODOS' 
    ? wishes 
    : wishes.filter(w => w.category === selectedCategory);

  // Calculations for summary
  const totalTarget = wishes.reduce((acc, w) => acc + w.targetAmount, 0);
  const totalSaved = wishes.reduce((acc, w) => acc + w.savedAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Categories for segmented control
  const filterCategories = ['TODOS', ...Object.values(Category)];

  return (
    <div className="min-h-screen pb-20 bg-manifest-950 font-sans selection:bg-gold-500/30 selection:text-gold-200 relative">
      
      {/* Status Indicator */}
      <div className="fixed top-4 right-4 z-[40] pointer-events-none">
         {isOffline ? (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-500/30 rounded-full backdrop-blur-md">
                <WifiOff size={12} className="text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-200">Offline / Demo</span>
             </div>
         ) : (
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-950/20 border border-green-500/10 rounded-full backdrop-blur-md opacity-50 hover:opacity-100 transition-opacity">
                <Wifi size={12} className="text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-200">AI Connected</span>
             </div>
         )}
      </div>

      {/* Celebration Overlay */}
      {celebratingWish && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-700">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                   {/* CSS Particles */}
                   <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gold-400 rounded-full animate-ping" style={{animationDuration: '1s'}}></div>
                   <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-gold-200 rounded-full animate-ping" style={{animationDuration: '1.5s'}}></div>
                   <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gold-500 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
                   <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-gold-300 rounded-full animate-ping" style={{animationDuration: '2.5s'}}></div>
              </div>
              
              <div className="text-center p-8 relative z-10 max-w-2xl w-full">
                  <div className="inline-block p-6 rounded-full bg-gold-gradient shadow-[0_0_50px_rgba(212,175,55,0.6)] mb-8 animate-bounce">
                      <Trophy size={64} className="text-manifest-950" />
                  </div>
                  <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      ¡META LOGRADA!
                  </h2>
                  <p className="text-2xl text-gold-200 font-light tracking-[0.2em] uppercase mb-8 border-y border-gold-500/30 py-4">
                      {celebratingWish.title}
                  </p>
                  <p className="text-white/60 mb-12 text-lg">
                      Has demostrado que con visión y disciplina, el éxito es inevitable.
                      <br/>Tu imperio sigue creciendo.
                  </p>
                  <button 
                    onClick={() => setCelebratingWish(null)}
                    className="bg-white text-black px-12 py-4 rounded-full font-bold tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                      CONTINUAR EL LEGADO
                  </button>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {wishToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setWishToDelete(null)} />
            <div className="relative bg-manifest-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-2xl font-display font-medium text-white mb-3 tracking-wide">¿Eliminar Meta?</h3>
                <p className="text-manifest-300 text-sm mb-8 leading-relaxed font-light">
                    Esta acción eliminará permanentemente esta visión de tu tablero. Es irreversible.
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setWishToDelete(null)}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-manifest-300 hover:bg-white/10 hover:text-white transition-all text-[10px] uppercase tracking-[0.2em] font-bold"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3.5 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-all text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg hover:shadow-red-900/20"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Hero now contains all the stats "above the fold" */}
      <VisionBoardHero 
          wishes={wishes} 
          totalSaved={totalSaved}
          totalTarget={totalTarget}
          totalProgress={totalProgress}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-6 md:gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-display font-medium text-white mb-2">Tablero de Visión</h2>
            <p className="text-manifest-400 font-light tracking-wide">Gestiona tu imperio personal.</p>
          </div>
          
          <button 
            onClick={openCreateModal}
            className="group relative px-6 py-3 md:px-8 md:py-4 bg-gold-500 text-manifest-950 rounded-xl font-bold uppercase tracking-[0.15em] overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] w-full md:w-auto justify-center flex"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center gap-3">
               <Plus size={20} /> Nueva Meta
            </div>
          </button>
        </div>

        {/* Segmented Control for Categories */}
        <div className="flex overflow-x-auto py-4 px-4 mb-4 gap-2 no-scrollbar">
            {filterCategories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                        px-4 py-2 md:px-6 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 border
                        hover:scale-105 active:scale-95
                        ${selectedCategory === cat 
                            ? 'bg-gold-500 text-manifest-950 border-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                            : 'bg-white/5 text-manifest-400 border-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-md'}
                    `}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Grid - Increased gap for mobile (gap-12) to prevent cards touching */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-8 pb-20">
          {filteredWishes.map((wish, index) => (
            <div key={wish.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                <WishCard 
                    wish={wish} 
                    onAddSavings={handleAddSavings}
                    onDelete={requestDelete} 
                    onComplete={handleComplete}
                    onEdit={openEditModal}
                />
            </div>
          ))}
          
          {wishes.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                <div className="relative w-24 h-24 mx-auto mb-4 opacity-80">
                   <Fish className="absolute top-0 right-4 text-gold-300 transform rotate-[45deg] animate-[pulse_3s_infinite]" size={48} strokeWidth={1} />
                   <Fish className="absolute bottom-0 left-4 text-gold-600 transform -rotate-[135deg]" size={48} strokeWidth={1} />
                </div>
                <p className="text-manifest-300 text-lg font-light">Tu tablero está vacío.</p>
                <p className="text-manifest-500 text-sm mt-2">Es hora de definir tu primera conquista.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-manifest-950/80 backdrop-blur-xl transition-opacity" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-manifest-900 w-full max-w-5xl md:rounded-3xl rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-hidden">
            
            {/* Preview / Image Side (Left/Bottom) */}
            <div className="w-full md:w-1/2 bg-black relative flex flex-col order-2 md:order-1 shrink-0">
                <div className="absolute inset-0 bg-gold-gradient opacity-5 mix-blend-overlay pointer-events-none"></div>
                
                {/* Image Area */}
                <div className="flex-1 relative overflow-hidden group min-h-[300px] md:min-h-0 bg-manifest-950">
                     {formImage ? (
                         <>
                            <img src={formImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-manifest-950 via-transparent to-transparent"></div>
                         </>
                     ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-manifest-600 p-12 text-center">
                             {regeneratingImage ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="animate-spin mb-4 text-gold-400" size={48} />
                                    <p className="text-xs uppercase tracking-widest animate-pulse">Generando Visualización...</p>
                                </div>
                             ) : (
                                <div>
                                    <Sparkles className="mx-auto mb-4 opacity-20" size={64} />
                                    <p className="text-xs uppercase tracking-widest">La imagen se generará con IA</p>
                                    <p className="text-[9px] text-manifest-600 mt-2">O pega una imagen (Ctrl + V)</p>
                                </div>
                             )}
                         </div>
                     )}
                     
                     {/* Regenerate Button Overlay - Only visible in AI mode */}
                     {!regeneratingImage && imageTab === 'ai' && (
                        <div className="absolute top-6 right-6 z-20">
                            <button
                                type="button"
                                onClick={handleRegenerateImage}
                                className="bg-black/60 backdrop-blur-md border border-white/20 text-white p-3 rounded-full hover:bg-gold-500 hover:text-black transition-all shadow-xl hover:rotate-180 duration-500"
                                title="Regenerar Imagen con IA"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                     )}
                </div>

                {/* VISUAL SOURCE TOOLS (REPLACES OLD PROMPT INPUT) */}
                <div className="bg-manifest-950/80 backdrop-blur-md border-t border-white/10 z-10 relative flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        <button 
                            type="button"
                            onClick={() => setImageTab('ai')}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${imageTab === 'ai' ? 'bg-white/5 text-gold-400 border-b-2 border-gold-500' : 'text-manifest-500 hover:text-white'}`}
                        >
                            <Sparkles size={14} /> Generar IA
                        </button>
                        <button 
                             type="button"
                            onClick={() => setImageTab('manual')}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${imageTab === 'manual' ? 'bg-white/5 text-gold-400 border-b-2 border-gold-500' : 'text-manifest-500 hover:text-white'}`}
                        >
                            <ImageIcon size={14} /> Subir / Link
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:px-8 md:py-6">
                        {imageTab === 'ai' ? (
                             <div className="space-y-3">
                                  <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold flex items-center gap-2">
                                        <Wand2 size={12} /> Prompt Personalizado
                                  </label>
                                  <div className="relative">
                                    <input
                                        type="text"
                                        value={formPrompt}
                                        onChange={(e) => setFormPrompt(e.target.value)}
                                        placeholder="Ej: Mansión moderna en acantilado..."
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-manifest-100 focus:border-gold-500 outline-none placeholder:text-manifest-600 transition-colors"
                                    />
                                  </div>
                             </div>
                        ) : (
                             <div className="space-y-4">
                                  {/* Upload Button */}
                                  <div 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-manifest-400 hover:bg-white/5 hover:border-gold-500/50 hover:text-gold-200 cursor-pointer transition-all group"
                                  >
                                      <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                      <span className="text-xs font-medium">Click para subir imagen</span>
                                      <span className="text-[9px] uppercase tracking-wider opacity-60 mt-1">O pega con Ctrl + V</span>
                                  </div>
                                  <input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={handleFileUpload}
                                  />
                                  
                                  {/* URL Input */}
                                  <div className="space-y-2">
                                       <label className="text-[10px] uppercase tracking-widest text-manifest-500 font-bold ml-1 block">O inserta un enlace</label>
                                       <div className="relative">
                                           <input 
                                               type="text"
                                               placeholder="https://ejemplo.com/imagen.jpg"
                                               value={formImage.startsWith('data:') ? '' : formImage} 
                                               onChange={(e) => setFormImage(e.target.value)}
                                               className="w-full pl-9 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-xs text-manifest-100 focus:border-gold-500 outline-none"
                                           />
                                           <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manifest-500" />
                                       </div>
                                  </div>
                             </div>
                        )}
                    </div>
                </div>

                {/* AI Plan Area */}
                <div className="p-4 md:p-8 bg-manifest-950 border-t border-white/10 h-auto md:h-1/3 md:overflow-y-auto md:custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-gold-400">
                            <BrainCircuit size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Plan de Éxito (IA)</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleGeneratePlan}
                            disabled={generatingPlan || !formTitle || !formCost}
                            className="text-[10px] text-manifest-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors disabled:opacity-30"
                        >
                            {generatingPlan ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                            {formPlan ? 'Regenerar Plan' : 'Generar Plan'}
                        </button>
                    </div>
                    
                    {formPlan ? (
                        <div className="text-sm text-manifest-300 font-light leading-relaxed whitespace-pre-wrap">
                            {formPlan}
                        </div>
                    ) : (
                        <p className="text-manifest-600 text-sm italic">
                            Genera un plan estratégico de 3 pasos para lograr este objetivo.
                        </p>
                    )}
                </div>
            </div>

            {/* Form Side (Right/Top) */}
            <div className="w-full md:w-1/2 p-6 md:p-10 md:overflow-y-auto md:custom-scrollbar flex flex-col order-1 md:order-2 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-display font-medium text-gold-100">
                            {editingWishId ? 'Rediseñar Meta' : 'Diseñar Nueva Meta'}
                        </h2>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-manifest-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1 mb-2 block">Título</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Penthouse en NY"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="w-full px-4 py-4 bg-manifest-900/50 border border-white/10 text-white rounded-xl focus:border-gold-500 outline-none transition-all placeholder-manifest-600 focus:bg-manifest-800"
                        />
                    </div>

                    {/* Row 1: Cost + Date */}
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1 mb-2 block">Costo ($)</label>
                            <input
                                type="number"
                                required
                                placeholder="1000000"
                                value={formCost}
                                onChange={(e) => setFormCost(e.target.value)}
                                className="w-full px-4 py-4 bg-manifest-900/50 border border-white/10 text-white rounded-xl focus:border-gold-500 outline-none transition-all placeholder-manifest-600 focus:bg-manifest-800"
                            />
                        </div>

                         <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1 mb-2 block">Fecha</label>
                            <input
                                type="date"
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                                className="w-full px-4 py-4 bg-manifest-900/50 border border-white/10 text-white rounded-xl focus:border-gold-500 outline-none transition-all placeholder-manifest-600 focus:bg-manifest-800 [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Row 2: Category + Priority */}
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1 mb-2 block">Categoría</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value as Category)}
                                    className="w-full px-4 py-4 pr-10 bg-manifest-900/50 border border-white/10 text-white rounded-xl focus:border-gold-500 outline-none transition-all appearance-none cursor-pointer placeholder-manifest-600 focus:bg-manifest-800"
                                >
                                    {Object.values(Category).map((cat) => (
                                        <option key={cat} value={cat} className="bg-manifest-900 text-white">{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-manifest-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1 mb-2 block">Prioridad</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formImportance}
                                    onChange={(e) => setFormImportance(e.target.value as Importance)}
                                    className="w-full px-4 py-4 pr-10 bg-manifest-900/50 border border-white/10 text-white rounded-xl focus:border-gold-500 outline-none transition-all appearance-none cursor-pointer placeholder-manifest-600 focus:bg-manifest-800"
                                >
                                    {Object.values(Importance).map((imp) => (
                                        <option key={imp} value={imp} className="bg-manifest-900 text-white">{imp}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-manifest-500 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1 mb-2 block">Descripción Visual</label>
                        <textarea
                            placeholder="Describe tu sueño con lujo de detalles..."
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            className="w-full px-4 py-4 bg-manifest-900/50 border border-white/10 text-white rounded-xl focus:border-gold-500 outline-none h-24 resize-none transition-all placeholder-manifest-600 focus:bg-manifest-800 custom-scrollbar"
                        />
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 md:py-4 bg-gold-500 hover:bg-gold-400 text-manifest-950 rounded-xl font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (editingWishId ? 'Guardar Cambios' : 'Comenzar Ahora')}
                        </button>
                    </div>
                </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;