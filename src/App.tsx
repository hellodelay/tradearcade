import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Timer, Trophy, Play, RotateCcw, ArrowRight, ArrowLeft, ShoppingCart, Zap, DollarSign, Banknote, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateStock, StockData } from './lib/gameUtils';
import { StockCard } from './components/StockCard';
import { SwipeActionCard } from './components/SwipeActionCard';
import { sounds } from './lib/sounds';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type GameState = 'MENU' | 'TUTORIAL' | 'PLAYING' | 'RESULTS';

const INITIAL_DECISION_LIMIT = 3000;
const MIN_DECISION_LIMIT = 1000;
const INITIAL_NEXT_DELAY = 1000;
const MIN_NEXT_DELAY = 300;
const SCALING_FACTOR = 0.05;
const GAME_DURATION = 30;
const INITIAL_DAY_TARGET = 15000;

interface VFXItem {
    id: number;
    type: 'CORRECT' | 'WRONG';
    icon: React.ReactNode;
    style: React.CSSProperties;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [currentDay, setCurrentDay] = useState(1);
  const [dayTarget, setDayTarget] = useState(INITIAL_DAY_TARGET);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | 'TIMEOUT' | null>(null);
  const [lastResult, setLastResult] = useState<'CORRECT' | 'WRONG' | 'TIMEOUT' | null>(null);
  const [shake, setShake] = useState(false);
  const [bestRunSales, setBestRunSales] = useState(() => {
    const saved = localStorage.getItem('trade_arcade_best_sales');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [bestRunDays, setBestRunDays] = useState(() => {
    const saved = localStorage.getItem('trade_arcade_best_days');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalRunSales, setTotalRunSales] = useState(0);
  const [vfx, setVfx] = useState<VFXItem[]>([]);
  
  const [streak, setStreak] = useState(0);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [decisionTimeLeft, setDecisionTimeLeft] = useState(INITIAL_DECISION_LIMIT);
  const decisionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getDecisionLimit = useCallback(() => {
    // Scaling difficulty based on streak + current day
    const dayModifier = Math.pow(0.95, currentDay - 1);
    const reduced = INITIAL_DECISION_LIMIT * Math.pow(1 - SCALING_FACTOR, streak) * dayModifier;
    return Math.max(MIN_DECISION_LIMIT, reduced);
  }, [streak, currentDay]);

  const triggerVFX = (type: 'CORRECT' | 'WRONG') => {
    const icons = type === 'CORRECT' 
        ? [<DollarSign className="w-8 h-8"/>, <Plus className="w-8 h-8"/>]
        : [<Minus className="w-8 h-8"/>];
    
    const newItems: VFXItem[] = icons.map((icon, i) => ({
        id: Math.random(),
        type,
        icon,
        style: {
            left: `${40 + Math.random() * 20}%`,
            top: `${40 + Math.random() * 20}%`,
        }
    }));
    setVfx(prev => [...prev, ...newItems]);
    setTimeout(() => setVfx(prev => prev.filter(v => !newItems.includes(v))), 800);
  };

  const handleTimeout = useCallback(() => {
    setFeedback('TIMEOUT');
    setLastResult('TIMEOUT');
    setShake(true);
    setStreak(0);
    setScore(prev => Math.max(0, prev - 300));
    sounds.playTradeFail();
    setTimeout(() => {
        setShake(false);
        nextStock();
    }, 500);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('RESULTS');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'PLAYING' && !isWaitingForNext && stocks.length > 0) {
      const limit = getDecisionLimit();
      setDecisionTimeLeft(limit);
      
      const interval = setInterval(() => {
        setDecisionTimeLeft(prev => {
           if (prev <= 100) {
              clearInterval(interval);
              handleTimeout();
              return 0;
           }
           return prev - 100;
        });
      }, 100);

      decisionIntervalRef.current = interval;
      return () => {
          if (decisionIntervalRef.current) clearInterval(decisionIntervalRef.current);
      }
    }
  }, [gameState, isWaitingForNext, stocks[0]?.id, getDecisionLimit, handleTimeout]);

  const nextStock = () => {
    if (decisionIntervalRef.current) clearInterval(decisionIntervalRef.current);
    setIsWaitingForNext(true);

    if (Math.random() < 0.15) {
        setIsReversed(prev => !prev);
    }
    
    const lingerTime = 800;

    setTimeout(() => {
        setStocks(prev => {
            const next = prev.slice(1);
            if (next.length < 5) {
                return [...next, generateStock(), generateStock(), generateStock()];
            }
            return next;
        });
        setFeedback(null);
        setLastResult(null);
        
        setTimeout(() => {
            setIsWaitingForNext(false);
        }, 50);
    }, lingerTime);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isWaitingForNext || stocks.length === 0) return;
    
    const currentStock = stocks[0];
    let directionToUse = direction;
    if (isReversed) {
        directionToUse = direction === 'right' ? 'left' : 'right';
    }

    const isBuy = directionToUse === 'left';
    // Buy Low (correct if negative), Sell High (correct if positive)
    const isCorrect = (isBuy && !currentStock.isPositive) || (!isBuy && currentStock.isPositive);

    const resultType = isCorrect ? 'CORRECT' : 'WRONG';
    setFeedback(resultType);
    setLastResult(resultType);

    if (isCorrect) {
      const limit = getDecisionLimit();
      const timeBonusFactor = decisionTimeLeft / limit;
      const bonus = Math.floor(timeBonusFactor * 1000);
      
      setScore(prev => prev + 1000 + bonus + (streak * 100));
      setStreak(prev => Math.min(4, prev + 1));
      sounds.playTradeSuccess(streak + 1);
      triggerVFX('CORRECT');
      confetti({
        particleCount: 25,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#ffffff']
      });
    } else {
      setScore(prev => Math.max(0, prev - 500));
      setStreak(0);
      setShake(true);
      sounds.playTradeFail();
      triggerVFX('WRONG');
      setTimeout(() => setShake(false), 200);
    }

    nextStock();
  };

  const startGame = (resetProgression: boolean = true) => {
    if (resetProgression) {
        setCurrentDay(1);
        setDayTarget(INITIAL_DAY_TARGET);
        setScore(0);
        setTotalRunSales(0);
    } else {
        // Advance progression
        setTotalRunSales(prev => prev + score);
        setCurrentDay(prev => prev + 1);
        setDayTarget(prev => Math.floor(prev * 1.3));
        setScore(0);
    }
    
    setTimeLeft(GAME_DURATION);
    setStreak(0);
    setIsReversed(false);
    setStocks(Array.from({ length: 10 }, generateStock));
    setGameState('PLAYING');
    setFeedback(null);
    setLastResult(null);
    setIsWaitingForNext(false);
  };

  useEffect(() => {
    const currentTotal = totalRunSales + score;
    if (currentTotal > bestRunSales) {
      setBestRunSales(currentTotal);
      localStorage.setItem('trade_arcade_best_sales', currentTotal.toString());
    }
    if (currentDay > bestRunDays) {
      setBestRunDays(currentDay);
      localStorage.setItem('trade_arcade_best_days', currentDay.toString());
    }
  }, [score, totalRunSales, currentDay, bestRunSales, bestRunDays]);

  return (
    <div className={cn("relative w-full h-screen flex flex-col items-center justify-center bg-[#1a1a2e] overflow-hidden p-6 z-0", shake && "shake")}>
      
      <div className="scanlines" />

      {/* VFX Layer */}
      <AnimatePresence>
        {vfx.map((item) => (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -250, scale: 2 }}
                exit={{ opacity: 0 }}
                style={item.style}
                className={cn(
                    "absolute z-[100] pointer-events-none drop-shadow-xl font-pixel",
                    item.type === 'CORRECT' ? "text-emerald-400" : "text-rose-400"
                )}
            >
                {item.icon}
            </motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <AnimatePresence mode="wait">
        {gameState === 'MENU' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="z-10 flex flex-col items-center space-y-12 text-center"
          >
            <div className="space-y-4">
                <div className="bg-black p-8 pixel-border">
                    <div className="flex flex-col items-center mb-4">
                        <TrendingUp className="w-16 h-16 text-emerald-400 mb-2" />
                        <h1 className="text-4xl md:text-6xl font-pixel tracking-tighter text-white">
                            TRADE<br/><span className="text-indigo-400">ARCADE</span>
                        </h1>
                    </div>
                    <p className="text-white font-pixel text-[10px] tracking-widest bg-indigo-900/50 py-2 uppercase">Realistic Stock Simulator</p>
                </div>
            </div>

            <div className="flex flex-col space-y-8 w-full items-center">
                <SwipeActionCard 
                    centerLabel="LET'S_TRADE!!" 
                    rightLabel="TO_START"
                    onSwipeRight={() => setGameState('TUTORIAL')} 
                />
                
                <div className="bg-black py-4 px-6 border-4 border-indigo-900 grid grid-cols-2 gap-4 w-full max-w-[280px]">
                    <div>
                        <span className="text-[8px] text-indigo-400 font-pixel block mb-1">BEST_RUN</span>
                        <span className="font-pixel text-white text-xs">${bestRunSales.toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="text-[8px] text-indigo-400 font-pixel block mb-1">MAX_DAYS</span>
                        <span className="font-pixel text-white text-xs">{bestRunDays}</span>
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {gameState === 'TUTORIAL' && (
          <motion.div
            key="tutorial"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-6"
          >
            <div className="bg-[#1a1a2e] border-8 border-white p-10 max-w-lg text-white shadow-2xl relative w-full">
                <h3 className="text-3xl font-pixel text-center mb-8 text-yellow-400">BRIEFING</h3>
                
                <div className="space-y-6 mb-10 font-pixel text-xs leading-loose">
                    <p className="text-center text-yellow-400 border-b border-white/10 pb-4 mb-4">BUY LOW, SELL HIGH</p>
                    <p className="text-emerald-400">➤ SWIPE RIGHT: SELL 📉</p>
                    <p className="text-rose-400">➤ SWIPE LEFT: BUY 🚀</p>
                    
                    <div className="border-t-2 border-white/20 pt-6">
                        <div className="flex items-center space-x-3 mb-2">
                           <div className="bg-yellow-400 text-black px-2 py-1 text-[8px] font-pixel animate-pulse border-2 border-black">
                                REVERSE MARKET
                            </div>
                            <span className="text-yellow-400">DETECTED</span>
                        </div>
                        <p className="text-white/60">WHEN ACTIVE: SWIPE RULES ARE INVERTED. DO THE OPPOSITE ACTION.</p>
                    </div>
                </div>

                <div className="flex justify-center mt-4">
                    <SwipeActionCard 
                        centerLabel="START_DAY_1" 
                        leftLabel="TO_MENU"
                        rightLabel="TO_BEGIN"
                        onSwipeLeft={() => setGameState('MENU')}
                        onSwipeRight={() => startGame(true)}
                        variant="success"
                    />
                </div>
            </div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full h-full flex flex-col items-center"
          >
            {/* HUD */}
            <div className="w-full max-w-2xl bg-black border-4 border-white p-4 mt-2 mb-4 relative">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[8px] font-pixel text-yellow-400">DAY_{currentDay}</span>
                            <span className="text-[8px] font-pixel text-white/40">TARGET: ${dayTarget.toLocaleString()}</span>
                        </div>
                        <span className="text-4xl md:text-5xl font-black text-white tabular-nums">${score.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-pixel text-emerald-400 mb-1">BOOST</span>
                            <span className="text-2xl font-pixel text-emerald-400">x{streak}</span>
                        </div>
                        <div className="bg-rose-600 px-4 py-2 border-4 border-black">
                            <span className="text-2xl font-pixel text-white tabular-nums">{timeLeft}s</span>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isReversed && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-yellow-400 flex items-center justify-center z-20 border-4 border-black"
                        >
                            <span className="text-black font-pixel text-xs animate-pulse">
                                ! MARKET REVERSED !
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Deck */}
            <div className="relative w-full flex-1 flex items-center justify-center">
                <AnimatePresence>
                    {stocks.slice(0, 1).map((stock) => (
                        <StockCard
                            key={stock.id}
                            stock={stock}
                            isFront={true}
                            onSwipe={handleSwipe}
                            decisionTimeLeft={decisionTimeLeft}
                            decisionTimeLimit={getDecisionLimit()}
                            tradeResult={lastResult}
                            streak={streak}
                            isReversed={isReversed}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Simulated Desktop Footer */}
            <div className="flex justify-around bg-black p-4 border-t-4 border-white w-full max-w-2xl">
                 <div className="text-[10px] font-pixel text-white/50">NODE_01</div>
                 <div className="text-[10px] font-pixel text-white">UPTIME: {timeLeft}s</div>
                 <div className="text-[10px] font-pixel text-indigo-400">TRAD_ARCADE_v.2</div>
            </div>
          </motion.div>
        )}

        {gameState === 'RESULTS' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 flex flex-col items-center space-y-8 w-full max-w-sm text-center"
          >
            <div className="bg-black border-8 border-white p-10 text-white shadow-2xl w-full space-y-8">
                <div>
                    <h2 className="text-[10px] font-pixel text-white/50 mb-4 tracking-widest uppercase">DAY_{currentDay}_REPORT</h2>
                    <div className={cn(
                        "text-2xl font-pixel py-2 mb-4 border-2",
                        score >= dayTarget ? "text-emerald-400 border-emerald-400" : "text-rose-400 border-rose-400"
                    )}>
                        {score >= dayTarget ? 'QUOTA_MET' : 'QUOTA_FAILED'}
                    </div>
                    <div className="text-4xl md:text-5xl font-pixel text-yellow-400 mb-2">
                        ${score.toLocaleString()}
                    </div>
                    <div className="text-white/50 font-pixel text-[10px]">
                        TARGET: ${dayTarget.toLocaleString()}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-900/50 p-4 border-2 border-white">
                        <span className="text-[8px] font-pixel text-white/50 block mb-1">RUN_TOTAL</span>
                        <span className="font-pixel text-white text-lg">${(totalRunSales + score).toLocaleString()}</span>
                    </div>
                    <div className="bg-indigo-900/50 p-4 border-2 border-white">
                        <span className="text-[8px] font-pixel text-white/50 block mb-1">RECORD</span>
                        <span className="font-pixel text-white text-lg">${bestRunSales.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col space-y-6 w-full items-center">
                {score >= dayTarget ? (
                    <SwipeActionCard 
                        centerLabel={`DAY_${currentDay}_CLEAR`}
                        leftLabel="TO_QUIT"
                        rightLabel="TO_NEXT_DAY"
                        onSwipeLeft={() => setGameState('MENU')}
                        onSwipeRight={() => startGame(false)}
                        variant="success"
                    />
                ) : (
                    <SwipeActionCard 
                        centerLabel="SESSION_END"
                        leftLabel="TO_QUIT"
                        rightLabel="TO_RESTART"
                        onSwipeLeft={() => setGameState('MENU')}
                        onSwipeRight={() => startGame(true)}
                        variant="danger"
                    />
                )}
                
                <div className="text-white/20 font-pixel text-[8px] uppercase tracking-widest animate-pulse">
                    Swipe Left to Quit | Swipe Right to Continue
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
