import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[rgba(10,22,40,0.82)] backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 shadow-[0_4px_28px_rgba(0,0,0,0.55)] ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
