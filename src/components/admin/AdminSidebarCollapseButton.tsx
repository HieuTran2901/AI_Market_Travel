import { ChevronLeft } from 'lucide-react';

export const AdminSidebarCollapseButton = ({
  collapsed,
  disabled = false,
  onToggle,
}: {
  collapsed: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
    title={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
    className="absolute -right-3 top-24 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-80 xl:flex dark:border-slate-700 dark:bg-[#081321] dark:text-slate-300"
  >
    <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
  </button>
);
