import React from 'react';

const transitionClass =
  'transition-[opacity,transform,max-width,max-height,margin] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-100';

export const AdminSidebarText = ({
  hidden,
  children,
  className = '',
}: {
  hidden: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    aria-hidden={hidden}
    className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap ${transitionClass} ${
      hidden ? 'max-w-0 -translate-x-1.5 opacity-0' : 'max-w-[180px] translate-x-0 opacity-100'
    } ${className}`}
  >
    {children}
  </span>
);

export const AdminSidebarSectionLabel = ({
  hidden,
  children,
}: {
  hidden: boolean;
  children: React.ReactNode;
}) => (
  <p
    aria-hidden={hidden}
    className={`px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 ${transitionClass} ${
      hidden ? 'mb-0 max-h-0 -translate-x-1 overflow-hidden opacity-0' : 'mb-2 max-h-6 translate-x-0 opacity-100'
    }`}
  >
    {children}
  </p>
);
