import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface StateBlockProps {
  variant?: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const icons = {
  loading: Loader2,
  empty: Inbox,
  error: AlertCircle,
};

const colors = {
  loading: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  empty: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400',
  error: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
};

export const StateBlock: React.FC<StateBlockProps> = ({
  variant = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  const Icon = icons[variant];

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white px-6 py-12 text-center transition-colors dark:border-slate-700/60 dark:bg-slate-900/90', className)}>
      <div className={cn('mx-auto flex h-12 w-12 items-center justify-center rounded-full', colors[variant])}>
        <Icon className={cn('h-6 w-6', variant === 'loading' && 'animate-spin')} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-slate-50">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
