import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, FlaskConical, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DevControlsProps {
  onSimulate: (outcome: 'success' | 'failed' | 'expired') => void;
  className?: string;
}

export const DevControls: React.FC<DevControlsProps> = ({ onSimulate, className }) => {
  const [open, setOpen] = useState(false);

  const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

  if (!isDevelopment) return null;

  return (
    <div className={cn('rounded-2xl border border-amber-300/80 bg-amber-50/80 shadow-sm', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <FlaskConical className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-black text-amber-900">
            Developer Tools
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800">
              DEV ONLY
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-amber-700">
            MockPaymentGateway scenarios are hidden here during development.
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-amber-700" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-amber-200 px-4 pb-4 pt-3">
              <p className="mb-3 flex items-start gap-2 text-xs leading-5 text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                These controls simulate gateway responses for testing the full payment workflow without external integrations.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSimulate('success')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-200 transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Success
                </button>
                <button
                  type="button"
                  onClick={() => onSimulate('failed')}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-red-200 transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <XCircle className="h-4 w-4" />
                  Failure
                </button>
                <button
                  type="button"
                  onClick={() => onSimulate('expired')}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Timeout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

