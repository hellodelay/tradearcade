import React from 'react';

interface StockChartProps {
  prices: number[];
  color: string;
}

export const StockChart: React.FC<StockChartProps> = ({ prices, color }) => {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  
  const width = 300;
  const height = 150;
  const padding = 10;

  // Pixel art style: step-like points or just sharp lines
  const points = prices.map((p, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
    const y = (height - padding) - ((p - min) / (range || 1)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full bg-slate-900 border-2 border-black overflow-hidden relative">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px'
      }} />
      
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* The main line - rigid and thick for pixel feel */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="miter"
          points={points}
        />
        
        {/* End box - pixelated dot */}
        <rect
          x={width - padding - 4}
          y={(height - padding) - ((prices[prices.length - 1] - min) / (range || 1)) * (height - padding * 2) - 4}
          width="8"
          height="8"
          fill={color}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};
