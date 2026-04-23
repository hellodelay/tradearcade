import { motion, useMotionValue, useTransform } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { StockData } from '../lib/gameUtils';
import { StockChart } from './StockChart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockCardProps {
  stock: StockData;
  onSwipe: (dir: 'left' | 'right') => void;
  isFront: boolean;
  decisionTimeLeft?: number;
  decisionTimeLimit?: number;
  tradeResult?: 'CORRECT' | 'WRONG' | 'TIMEOUT' | null;
  streak?: number;
  isReversed?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ 
    stock, 
    onSwipe, 
    isFront, 
    decisionTimeLeft = 1, 
    decisionTimeLimit = 1,
    tradeResult,
    streak = 0,
    isReversed = false
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [swipedDir, setSwipedDir] = useState<number>(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  
  const progressWidth = (decisionTimeLeft / decisionTimeLimit) * 100;
  
  const timeBonusFactor = decisionTimeLeft / decisionTimeLimit;
  const potentialBonus = Math.floor(timeBonusFactor * 1000);
  const potentialScore = 1000 + potentialBonus + (streak * 100);

  const leftAction = isReversed ? "SELL" : "BUY";
  const rightAction = isReversed ? "BUY" : "SELL";

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 80) {
      setIsSwiped(true);
      setSwipedDir(500);
      onSwipe('right');
    } else if (info.offset.x < -80) {
      setIsSwiped(true);
      setSwipedDir(-500);
      onSwipe('left');
    }
  };

  // Exit animation: Far horizontal, very short vertical
  const exitY = tradeResult === 'CORRECT' ? -40 : tradeResult ? 40 : 0;
  const targetX = swipedDir !== 0 ? (swipedDir > 0 ? 800 : -800) : 0;

  return (
    <motion.div
      layout
      key={stock.id}
      style={{ 
          x, 
          rotate, 
          opacity, 
          zIndex: isFront ? 10 : 0 
      }}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: targetX,
        y: exitY, 
        opacity: 0,
        scale: 0.5,
        rotate: targetX > 0 ? 90 : -90,
        transition: { duration: 0.5, ease: "easeOut" }
      }}
      drag={isFront && !isSwiped ? "x" : false}
      dragConstraints={isSwiped ? false : { left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute w-full max-w-[320px] aspect-[3/4.2] bg-white text-black pixel-card select-none cursor-grab active:cursor-grabbing overflow-hidden",
        isFront ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"
      )}
    >
      <div className="relative h-full flex flex-col">
        {/* Decision Timer Bar */}
        {isFront && (
            <div className="absolute top-0 left-0 w-full h-4 bg-slate-200 z-50 border-b-4 border-black">
                <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${progressWidth}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    className={cn(
                        "h-full",
                        progressWidth < 30 ? "bg-rose-500" : "bg-indigo-500"
                    )} 
                />
            </div>
        )}
        
        <div className="p-4 flex justify-between items-start mt-4">
          <div>
            <h2 className="text-3xl font-pixel leading-none">{stock.ticker}</h2>
            <p className="text-[10px] font-pixel opacity-70 mt-1 uppercase">{stock.name}</p>
          </div>
          {isReversed ? (
            <div className="bg-yellow-400 text-black px-3 py-1 text-[8px] font-pixel animate-pulse border-2 border-black">
              REVERSE MARKET
            </div>
          ) : (
            <div className="bg-black text-white px-3 py-1 text-[8px] font-pixel opacity-20">
              STABLE MARKET
            </div>
          )}
        </div>

        <div className="flex-1 px-4 relative flex items-center justify-center min-h-0 py-2">
            <StockChart prices={stock.prices} color={stock.isPositive ? '#22c55e' : '#ef4444'} />
            
            {/* Swipe Indicators */}
            {isFront && (
              <div className="absolute inset-0 pointer-events-none p-4 flex justify-between items-center z-10">
                <motion.div 
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="flex flex-col items-center bg-black/80 px-2 py-1 border border-white/20"
                >
                   <ChevronLeft className={cn("w-4 h-4", leftAction === "BUY" ? "text-rose-400" : "text-emerald-400")} />
                   <span className={cn("text-[6px] font-pixel mt-1", leftAction === "BUY" ? "text-rose-400" : "text-emerald-400")}>{leftAction}</span>
                </motion.div>

                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="flex flex-col items-center bg-black/80 px-2 py-1 border border-white/20"
                >
                   <ChevronRight className={cn("w-4 h-4", rightAction === "BUY" ? "text-rose-400" : "text-emerald-400")} />
                   <span className={cn("text-[6px] font-pixel mt-1", rightAction === "BUY" ? "text-rose-400" : "text-emerald-400")}>{rightAction}</span>
                </motion.div>
              </div>
            )}
        </div>

        <div className="p-4 grid grid-cols-2 gap-2 border-t-4 border-black bg-slate-100">
          <div className="flex flex-col">
            <span className="text-[8px] font-pixel text-slate-500 mb-1">PROFIT_POTENTIAL</span>
            <span className="text-2xl font-black text-emerald-600 tabular-nums">+${potentialScore.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-pixel text-slate-500 mb-1">TYPE</span>
            <div className={cn(
              "flex items-center space-x-1 font-black px-2 py-1 border-2 border-black",
              stock.isPositive ? "bg-emerald-400" : "bg-rose-400"
            )}>
              {stock.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-xs font-pixel uppercase">{stock.isPositive ? 'BULL' : 'BEAR'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
