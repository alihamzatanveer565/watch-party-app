import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-white/70">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
            'transition-all duration-200',
            error && 'border-red-500/60 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
