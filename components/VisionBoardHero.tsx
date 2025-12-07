import React, { useState, useEffect } from 'react';
import { Wish } from '../types';
import { ChevronDown, Calendar, Wallet } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface VisionBoardHeroProps {
  wishes: Wish[];
  totalSaved: number;
  totalTarget: number;
  totalProgress: number;
}

const VisionBoardHero: React.FC<VisionBoardHeroProps> = ({ wishes, totalSaved, totalTarget, totalProgress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter only active wishes
  const activeWishes = wishes.filter(w => !w.isCompleted);

  useEffect(() => {
    if (activeWishes.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeWishes.length);
        setIsAnimating(false);
      }, 500); // Wait for exit animation
    }, 8000); // 8 seconds per slide

    return () => clearInterval(interval);
  }, [activeWishes.length]);

  // --- EMPTY STATE HERO ---
  if (activeWishes.length === 0) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-manifest-950 flex items-center justify-center text-white border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-manifest-800/30 via-manifest-950 to-manifest-950"></div>
        <div className="text-center p-6 relative z-10 animate-fade-in-up">
          <h1 className="font-display font-light text-5xl md:text-8xl mb-6 tracking-tight text-white drop-shadow-2xl">
            Diseña tu <span className="text-gold-gradient font-medium">Legado</span>
          </h1>
          <p className="text-lg md:text-xl text-manifest-300 font-light tracking-[0.3em] uppercase">
            Comienza tu primera meta abajo
          </p>
          <div className="mt-12 animate-bounce opacity-50">
             <ChevronDown className="mx-auto" size={32} />
          </div>
        </div>
      </div>
    );
  }

  const currentWish = activeWishes[currentIndex];
  const currentProgressPercent = (currentWish.savedAmount / currentWish.targetAmount) * 100;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-manifest-950 group border-b border-white/5 selection:bg-gold-500/30">
      
      {/* --- BACKGROUND LAYER --- */}
      {activeWishes.map((wish, index) => (
        <div 
          key={wish.id}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
            index === currentIndex ? 'opacity-60 scale-105' : 'opacity-0 scale-100'
          }`}
          style={{ backgroundImage: `url(${wish.imageUrl})` }}
        />
      ))}
      
      {/* Cinematic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-manifest-950 via-manifest-950/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-manifest-950/60 via-transparent to-manifest-950/60" />

      {/* --- MAIN CONTENT CONTAINER (Flex Column to fit viewport) --- */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-safe">
         
         {/* 1. TOP SECTION: Text Content */}
         <div className="flex-1 flex flex-col justify-center items-center text-center max-w-5xl mx-auto w-full pt-10 md:pt-0 pb-4">
            <div key={`title-${currentWish.id}`} className="animate-fade-in-up w-full">
                <div className="mb-3 md:mb-6 flex justify-center">
                     <span className="px-3 py-1 md:px-5 md:py-1.5 rounded-full glass-card text-[9px] md:text-xs font-bold tracking-[0.3em] uppercase text-gold-300 border border-gold-500/20 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                        {currentWish.category}
                    </span>
                </div>
                <h2 className="font-display font-medium text-4xl sm:text-5xl md:text-8xl lg:text-9xl leading-[0.9] text-white drop-shadow-2xl mb-3 md:mb-6">
                    {currentWish.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-xl text-manifest-100/90 max-w-xs md:max-w-2xl mx-auto font-light leading-relaxed tracking-wide drop-shadow-md line-clamp-2 md:line-clamp-none">
                    {currentWish.description}
                </p>
             </div>
         </div>

         {/* 2. BOTTOM SECTION: Stats Cards Container */}
         {/* Uses grid to place items side-by-side on desktop, stacked on mobile */}
         <div className="w-full max-w-6xl mx-auto pb-6 md:pb-12 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 items-end">
                
                {/* CARD 1: CURRENT WISH PROGRESS */}
                <div key={`stats-${currentWish.id}`} className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl w-full backdrop-blur-md border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-1.5 md:mb-3">
                        <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-manifest-400 font-bold flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                           Meta Actual
                        </span>
                        <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-manifest-500 uppercase tracking-wider">
                            {currentWish.targetDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar size={10} className="md:w-3 md:h-3" />
                                    {new Date(currentWish.targetDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end justify-between gap-3 mb-2">
                         <span className="text-gold-300 font-display font-medium text-lg md:text-2xl">${currentWish.targetAmount.toLocaleString()}</span>
                         <div className="text-xs text-white/70 font-mono mb-1">${currentWish.savedAmount.toLocaleString()}</div>
                    </div>

                    {/* Compact Bar */}
                    <div className="h-1.5 md:h-2 w-full bg-manifest-900 rounded-full overflow-hidden relative">
                        <div 
                            className="h-full bg-gold-gradient shadow-[0_0_10px_#D4AF37]"
                            style={{ width: `${currentProgressPercent}%` }}
                        />
                    </div>
                </div>

                {/* CARD 2: TOTAL WEALTH (Patrimonio) */}
                <div className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl w-full backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden group/card">
                    <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-manifest-400 mb-1 flex items-center gap-2">
                                <Wallet className="text-gold-500 w-3 h-3 md:w-4 md:h-4" />
                                Patrimonio Global
                             </p>
                             <h3 className="text-xl md:text-3xl font-display font-medium text-white tracking-tight">
                                ${totalSaved.toLocaleString()}
                             </h3>
                        </div>
                        <div className="text-right">
                             <div className="text-xl md:text-3xl font-display text-gold-300">{totalProgress.toFixed(0)}%</div>
                             <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-manifest-600">Total: ${totalTarget.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-2 md:mt-3 h-1 md:h-1.5 w-full bg-manifest-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gold-gradient shadow-[0_0_20px_#D4AF37]"
                            style={{ width: `${totalProgress}%` }}
                        />
                    </div>
                </div>

            </div>
         </div>
      </div>

      {/* Elegant Side Indicators (Desktop Only) */}
      <div className="absolute top-1/2 left-2 md:left-6 transform -translate-y-1/2 flex flex-col space-y-4 z-20 hidden md:flex">
        {activeWishes.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-1 transition-all duration-700 rounded-full ${
              idx === currentIndex ? 'bg-gold-400 h-12 shadow-[0_0_15px_#D4AF37]' : 'bg-white/10 h-2 hover:bg-white/30'
            }`}
          />
        ))}
      </div>
      
    </div>
  );
};

export default VisionBoardHero;