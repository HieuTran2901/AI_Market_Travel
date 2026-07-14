import React from 'react';
import { CalendarCheck, Search, SlidersHorizontal } from 'lucide-react';
import { StateBlock } from '@/components/ui/StateBlock';

export const ProviderBookingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Bookings</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">Provider bookings</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Booking management will appear here when provider order access is available.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400 dark:border-slate-700/60 dark:bg-slate-950/50 dark:text-slate-500">
              <Search className="h-4 w-4" />
              Search disabled
            </div>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400 dark:border-slate-700/60 dark:bg-slate-950/50 dark:text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              Status filter unavailable
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <StateBlock
          title="Provider booking endpoint is not wired yet"
          description="The frontend currently exposes cart, checkout, availability, and customer order creation flows, but no provider-specific bookings feed. No fake booking records are shown."
          className="border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Bookings', description: 'Provider booking list unavailable until an API is exposed.', icon: CalendarCheck },
          { title: 'Search', description: 'Search will connect once provider booking data exists.', icon: Search },
          { title: 'Filters', description: 'Status filtering requires real provider booking statuses.', icon: SlidersHorizontal },
        ].map(({ title, description, icon: Icon }) => (
          <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
