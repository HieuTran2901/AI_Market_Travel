import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  className,
}) => (
  <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{eyebrow}</p>
      )}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);
