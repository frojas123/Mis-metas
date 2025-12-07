import React, { useState } from 'react';
import { Wish } from '../types';
import ProgressBar from './ProgressBar';
import { Check, Trash2, Coins, Edit2, X, Calendar, BrainCircuit } from 'lucide-react';

interface WishCardProps {
  wish: Wish;
  onAddSavings: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onEdit: (wish: Wish) => void;
}

const WishCard: React.FC<WishCardProps> = ({ wish, onAddSavings, onDelete, onComplete, onEdit }) => {
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  const handleSave = () => {
    const amount = parseFloat(amountInput);
    if (!isNaN(amount) && amount > 0) {
      onAddSavings(wish.id, amount);
      setAmountInput('');
      setIsAddingMoney(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Delegamos la confirmación al componente padre para usar el modal personalizado
    onDelete(wish.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(wish);
  };

  const remaining = wish.targetAmount - wish.savedAmount;

  return (
    <div className={`
        relative rounded-2xl overflow-hidden transition-all duration-500 ease-out
        group flex flex-col h-full glass-card border border-white/10
        hover:border-gold-500/30 
        hover:transform hover:-translate-y-2 hover:scale-[1.01]
        hover:shadow-[0_20px_50px_-12px_rgba(212,175,55,0.15)]
        animate-in fade-in slide-in-from-bottom-8 duration-700
        ${wish.isCompleted ? 'opacity-80 grayscale-[0.5]' : ''}
    `}>
      {/* Image Section */}
      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-manifest-950/80 via-transparent to-transparent z-10 opacity-70 transition-opacity group-hover:opacity-50"></div>
        <img 
          src={wish.imageUrl} 
          alt={wish.title} 
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110"
        />
        
        {/* Actions Overlay (Visible on Hover for desktop, always for mobile/touch) */}
        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 transform translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0">
             <button 
                onClick={handleEditClick}
                className="bg-black/40 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full hover:bg-gold-500 hover:text-black transition-all hover:scale-110 active:scale-95"
                title="Ver detalles y Editar"
             >
                <Edit2 size={14} />
             </button>
             <button 
                onClick={handleDeleteClick}
                className="bg-black/40 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full hover:bg-red-500 transition-all hover:scale-110 active:scale-95"
                title="Eliminar"
             >
                <Trash2 size={14} />
             </button>
        </div>

        {wish.isCompleted && (
          <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
                <span className="block text-gold-400 font-display font-medium text-3xl tracking-widest uppercase border-y-2 border-gold-500 py-2 px-8 mb-2 shadow-gold-glow">
                Completado
                </span>
                <span className="text-xs text-white/80 uppercase tracking-widest">Misión Cumplida</span>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
             <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg self-start">
                {wish.category}
             </span>
             {wish.targetDate && (
                 <span className="text-[10px] font-semibold tracking-wider text-gold-200 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold-500/20 flex items-center gap-1.5 self-start">
                    <Calendar size={10} />
                    {new Date(wish.targetDate).toLocaleDateString()}
                 </span>
             )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col relative z-20 -mt-12">
        <div className="glass-panel p-6 rounded-xl shadow-2xl flex-grow flex flex-col border border-white/5 bg-manifest-900/10 backdrop-blur-md transition-all duration-500 group-hover:bg-manifest-900/40">
            <div className="mb-6">
                <h3 className="text-2xl font-display font-medium text-white leading-tight mb-2 group-hover:text-gold-100 transition-colors">{wish.title}</h3>
                <p className="text-manifest-300 text-sm line-clamp-2 font-light leading-relaxed">{wish.description}</p>
                {wish.actionPlan && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-gold-500/80 uppercase tracking-wider">
                        <BrainCircuit size={12} /> Plan Estratégico Activo
                    </div>
                )}
            </div>

            <div className="space-y-4 mt-auto pt-4 border-t border-white/5">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-[10px] text-manifest-500 uppercase tracking-widest mb-1 font-semibold">Ahorrado</div>
                        <div className="text-lg font-medium text-white">${wish.savedAmount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-manifest-500 uppercase tracking-widest mb-1 font-semibold">Meta</div>
                        <div className="text-lg font-display text-gold-200">${wish.targetAmount.toLocaleString()}</div>
                    </div>
                </div>
            
                <ProgressBar current={wish.savedAmount} target={wish.targetAmount} height="h-2" />
            
                {!wish.isCompleted && (
                    <div className="pt-2">
                    {isAddingMoney ? (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <input
                            type="number"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            placeholder="Monto"
                            className="w-full px-3 py-2 bg-manifest-950/40 border border-white/10 text-white rounded-lg focus:border-gold-500 outline-none text-sm placeholder:text-manifest-600 backdrop-blur-sm"
                            autoFocus
                        />
                        <button 
                            onClick={handleSave}
                            className="bg-gold-500 text-manifest-950 p-2 rounded-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                        >
                            <Check size={18} />
                        </button>
                        <button 
                            onClick={() => setIsAddingMoney(false)}
                            className="bg-transparent text-manifest-400 p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                        >
                            <X size={18} />
                        </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsAddingMoney(true)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-manifest-300 hover:text-white py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] group-hover:border-white/20 backdrop-blur-sm"
                            >
                                <Coins size={14} /> Inyectar Capital
                            </button>
                            {remaining <= 0 && (
                                <button 
                                    onClick={() => onComplete(wish.id)}
                                    className="flex-1 bg-gold-600 hover:bg-gold-500 text-manifest-950 py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse"
                                >
                                    <Check size={14} /> Completar
                                </button>
                            )}
                        </div>
                    )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WishCard;