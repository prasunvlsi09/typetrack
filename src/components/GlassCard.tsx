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
          ? "bg-white/40 backdrop-blur-[60px] backdrop-saturate-[250%] border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] rounded-[32px] p-6" 
          : "bg-white/5 backdrop-blur-[60px] backdrop-saturate-[250%] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-[32px] p-6",
        "glass-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
