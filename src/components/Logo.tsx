import React from 'react';

export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(37,99,235,0.6)] border border-white/30 flex items-center justify-center bg-blue-600 ${className}`}>
      {/* Deep blue liquid background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-800"></div>
      
      {/* Liquid Glass Reflection / Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/30 to-transparent opacity-80 pointer-events-none"></div>
      
      {/* Inner shadow for depth */}
      <div className="absolute inset-0 shadow-[inset_0_3px_6px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(0,0,0,0.5)] rounded-2xl pointer-events-none"></div>
      
      {/* Glossy top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/60 to-white/5 rounded-b-[100%] opacity-80 pointer-events-none mix-blend-overlay"></div>

      {/* SVG Icon */}
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 p-1.5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Keyboard Outline */}
        <rect x="16" y="32" width="68" height="44" rx="8" stroke="#e2e8f0" strokeWidth="4.5" />
        
        {/* Top Row Keys */}
        <circle cx="26" cy="44" r="3" fill="#e2e8f0" />
        <circle cx="38" cy="44" r="3" fill="#e2e8f0" />
        <circle cx="50" cy="44" r="3" fill="#e2e8f0" />
        <circle cx="62" cy="44" r="3" fill="#e2e8f0" />
        <circle cx="74" cy="44" r="3" fill="#e2e8f0" />

        {/* Bottom Row Keys */}
        <circle cx="32" cy="54" r="3" fill="#e2e8f0" />
        <circle cx="44" cy="54" r="3" fill="#e2e8f0" />
        <circle cx="56" cy="54" r="3" fill="#e2e8f0" />
        <circle cx="68" cy="54" r="3" fill="#e2e8f0" />

        {/* Spacebar */}
        <rect x="32" y="64" width="36" height="5" rx="2.5" fill="#e2e8f0" />

        {/* Arrow Path */}
        <path d="M 6 68 L 22 58 L 32 64 L 48 46 L 58 54 L 82 22" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        
        {/* Arrow Head */}
        <polygon points="86,16 72,18 84,30" fill="white" filter="url(#glow)" />
      </svg>
    </div>
  );
}
