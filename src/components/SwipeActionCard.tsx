import { motion, useMotionValue, useTransform } from 'motion/react';
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SwipeActionCardProps {
  centerLabel: string;
  leftLabel?: string;
  rightLabel?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  variant?: 'default' | 'danger' | 'success';
}

export const SwipeActionCard: React.FC<SwipeActionCardProps> = ({
  centerLabel,
  leftLabel,
  rightLabel,
  onSwipeLeft,
  onSwipeRight,
  variant = 'default'
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 80 && onSwipeRight) {
      setIsSwiped(true);
      onSwipeRight();
    } else if (info.offset.x < -80 && onSwipeLeft) {
      setIsSwiped(true);
      onSwipeLeft();
    }
  };

  const bgColor = {
    default: 'bg-white',
    danger: 'bg-rose-100',
    success: 'bg-emerald-100'
  }[variant];

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={handleDragEnd}
      animate={isSwiped ? { opacity: 0, scale: 0.5, transition: { duration: 0.2 } } : { scale: 1, opacity: 1 }}
      className={cn(
        "relative w-[280px] h-[160px] flex flex-col items-center justify-center pixel-border select-none cursor-grab active:cursor-grabbing",
        bgColor
      )}
    >
      <div className="absolute inset-x-0 bottom-4 flex w-full px-4 items-end">
          <div className="flex-1 flex flex-col items-start min-h-[40px] justify-end">
            {leftLabel && (
                <motion.div 
                    animate={{ x: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="flex flex-col items-start space-y-1"
                >
                    <div className="flex items-center space-x-1 text-[10px] font-pixel text-black/60">
                        <ChevronLeft size={12} strokeWidth={3} />
                        <span>SWIPE_L</span>
                    </div>
                    <span className="text-[8px] font-pixel bg-black text-white px-1 py-0.5">{leftLabel}</span>
                </motion.div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col items-end min-h-[40px] justify-end">
            {rightLabel && (
                <motion.div 
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="flex flex-col items-end space-y-1"
                >
                    <div className="flex items-center space-x-1 text-[10px] font-pixel text-black/60">
                        <span>SWIPE_R</span>
                        <ChevronRight size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[8px] font-pixel bg-black text-white px-1 py-0.5">{rightLabel}</span>
                </motion.div>
            )}
          </div>
      </div>

      <div className="text-xl font-pixel text-black text-center px-4">
        {centerLabel}
      </div>

      {/* Decorative corners */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-black/10" />
      <div className="absolute top-1 right-1 w-2 h-2 bg-black/10" />
    </motion.div>
  );
};
