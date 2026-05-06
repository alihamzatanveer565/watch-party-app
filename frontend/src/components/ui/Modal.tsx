'use client';

import { useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full max-w-md rounded-2xl bg-navy-800 border border-white/10 p-6 shadow-2xl',
        className,
      )}>
        {title && (
          <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
