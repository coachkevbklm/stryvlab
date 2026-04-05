import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// On étend HTMLAttributes pour accepter onClick, onMouseEnter, id, etc.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'widget';
  children: React.ReactNode;
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "rounded-card p-6 transition-all duration-300",
        variant === 'default' 
          ? "bg-surface" 
          : "bg-surface border border-white/50 hover:",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}