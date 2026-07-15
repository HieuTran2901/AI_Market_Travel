import React from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { ThemeMode, useTheme } from '@/context/ThemeContext';

const options: Array<{ value: ThemeMode; label: string; description: string; icon: React.ElementType }> = [
  { value: 'light', label: 'Light', description: 'Bright dashboard surfaces', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Deep navy dashboard surfaces', icon: Moon },
  { value: 'system', label: 'System', description: 'Match your OS preference', icon: Monitor },
];

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={`group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:scale-105 hover:border-blue-200 hover:text-blue-700 hover:shadow-md active:scale-95 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
};
export const ThemeMenu: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="border-t border-slate-200/80 px-2 py-3 dark:border-slate-700/70">
      <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        Appearance
      </p>
      <div className="space-y-1">
        {options.map(option => {
          const Icon = option.icon;
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
                active
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700/70">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black">{option.label}</span>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">{option.description}</span>
              </span>
              {active && <Check className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
