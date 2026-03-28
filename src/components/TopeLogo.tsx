import React, { useId } from 'react';

export type TopeModel = 'pro' | 'turbo' | 'tt' | 'tt2' | 'apex';

interface TopeLogoProps {
  className?: string;
  variant?: TopeModel;
}

export function TopeLogo({ className = "w-6 h-6", variant = 'pro' }: TopeLogoProps) {
  const id = useId();
  const colors = {
    pro: {
      grad1: '#4A72FF', grad2: '#A855F7', grad3: '#E15A72',
      arc1: '#C2EAF4', arc2: '#7293D9'
    },
    turbo: {
      grad1: '#10B981', grad2: '#84CC16', grad3: '#EAB308',
      arc1: '#FEF08A', arc2: '#047857'
    },
    tt: {
      grad1: '#1E3A8A', grad2: '#2563EB', grad3: '#60A5FA',
      arc1: '#BFDBFE', arc2: '#1D4ED8'
    },
    tt2: {
      grad1: '#0891B2', grad2: '#6366F1', grad3: '#D946EF',
      arc1: '#A5F3FC', arc2: '#4338CA'
    },
    apex: {
      grad1: '#F97316', grad2: '#EF4444', grad3: '#F43F5E',
      arc1: '#FDBA74', arc2: '#9F1239'
    }
  };

  const current = colors[variant] || colors['pro'];
  const gradId = `bulbGrad-${variant}-${id.replace(/:/g, '')}`;

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={current.grad1} />
          <stop offset="50%" stopColor={current.grad2} />
          <stop offset="100%" stopColor={current.grad3} />
        </linearGradient>
      </defs>

      {/* Rotating Outer Rings */}
      <g className="origin-center animate-spin" style={{ animationDuration: '3s' }}>
        {/* Light Arc (Top Right) */}
        <circle 
          cx="50" cy="50" r="42" 
          fill="none" stroke={current.arc1} strokeWidth="4" 
          strokeDasharray="70 264" strokeDashoffset="-15" strokeLinecap="round" 
        />
        {/* Dark Arc (Bottom Left) */}
        <circle 
          cx="50" cy="50" r="42" 
          fill="none" stroke={current.arc2} strokeWidth="5" 
          strokeDasharray="90 264" strokeDashoffset="-140" strokeLinecap="round" 
        />
      </g>

      {/* Static Center Bulb */}
      <g stroke={`url(#${gradId})`} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* Outer shell */}
        <path d="M 50 22 A 22 22 0 0 0 28 44 C 28 58 40 65 44 76 L 56 76 C 60 65 72 58 72 44 A 22 22 0 0 0 50 22 Z" />
        {/* Vertical line */}
        <line x1="50" y1="22" x2="50" y2="76" />
      </g>
    </svg>
  );
}
