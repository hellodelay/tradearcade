export interface StockData {
  id: string;
  name: string;
  ticker: string;
  prices: number[];
  isPositive: boolean;
  industry: string;
}

export const STOCK_NAMES = [
  { name: 'GigaGlitch', ticker: 'GLTH', industry: 'Software' },
  { name: 'NeonPulse', ticker: 'PULZ', industry: 'Energy' },
  { name: 'CyberCrust', ticker: 'CRST', industry: 'Food' },
  { name: 'VoidMining', ticker: 'VOID', industry: 'Mining' },
  { name: 'NeuralLink', ticker: 'LINK', industry: 'Tech' },
  { name: 'SynthWave', ticker: 'WAVE', industry: 'Entertainment' },
  { name: 'TitanSteel', ticker: 'TITN', industry: 'Industrial' },
  { name: 'AeroDash', ticker: 'DASH', industry: 'Logistics' },
  { name: 'BioBloom', ticker: 'BLOM', industry: 'Biotech' },
  { name: 'QuantumQubit', ticker: 'QUBT', industry: 'Computing' },
  { name: 'MacroHard', ticker: 'MCRH', industry: 'Infrastructure' },
  { name: 'SpaceSip', ticker: 'SSIP', industry: 'Beverage' },
  { name: 'DustBunny', ticker: 'DUST', industry: 'Cleanup' },
  { name: 'PixelPerfect', ticker: 'PIXL', industry: 'Design' },
  { name: 'AstroAgro', ticker: 'AGRO', industry: 'Farming' },
  { name: 'CryoCore', ticker: 'CRYO', industry: 'Storage' },
  { name: 'MoonShot', ticker: 'MOON', industry: 'Aerospace' },
  { name: 'HoloHab', ticker: 'HOLO', industry: 'Housing' },
];

export function generateStock(): StockData {
  const stockBase = STOCK_NAMES[Math.floor(Math.random() * STOCK_NAMES.length)];
  const isPositive = Math.random() > 0.5;
  const prices: number[] = [];
  
  let currentPrice = 50 + Math.random() * 100;
  prices.push(currentPrice);
  
  const segments = 20;
  // We want to force it to end either significantly higher or lower than it started
  // Or at least show a clear trend at the end
  for (let i = 0; i < segments; i++) {
    const volatility = 10;
    const trend = isPositive ? 2 : -2;
    // Add randomness but skew it towards the end
    const progress = i / segments;
    const skew = progress * trend;
    
    currentPrice += (Math.random() - 0.5) * volatility + skew;
    prices.push(Math.max(1, currentPrice));
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    ...stockBase,
    prices,
    isPositive
  };
}
