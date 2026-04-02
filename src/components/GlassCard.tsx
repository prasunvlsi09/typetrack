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
          ? "apple-glass-light rounded-[32px] p-6" 
          : "apple-glass-dark rounded-[32px] p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
