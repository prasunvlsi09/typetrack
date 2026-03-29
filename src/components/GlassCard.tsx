import React from 'react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAppContext } from '../context/AppContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { settings } = useAppContext();
  const isLight = settings.theme === 'light';

  return (
    <div
      className={cn(
        isLight 
          ? "bg-white/60 backdrop-blur-3xl backdrop-saturate-200 border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6" 
          : "bg-white/5 backdrop-blur-3xl backdrop-saturate-200 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-3xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
