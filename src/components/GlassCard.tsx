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
          ? "bg-black/5 backdrop-blur-xl border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] rounded-3xl p-6" 
          : "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] rounded-3xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
