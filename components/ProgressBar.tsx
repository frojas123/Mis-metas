import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, target, height = "h-3" }) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  
  return (
    <div className={`w-full bg-manifest-800 rounded-sm ${height} overflow-hidden border border-manifest-700/50`}>
      <div 
        className={`bg-gold-gradient ${height} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(212,175,55,0.4)] relative`}
        style={{ width: `${percentage}%` }}
      >
        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-white/20" />
      </div>
    </div>
  );
};

export default ProgressBar;