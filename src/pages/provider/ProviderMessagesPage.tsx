import React from 'react';
import { MessageSquare, SendHorizontal } from 'lucide-react';
import { StateBlock } from '@/components/ui/StateBlock';

export const ProviderMessagesPage: React.FC = () => (
  <div className="space-y-6">
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Messages</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">Provider inbox</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
        Customer inquiries and provider conversations will appear here when messaging APIs are available.
      </p>
    </section>

    <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700/60">
          <h2 className="text-base font-black text-slate-950 dark:text-slate-50">Conversations</h2>
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
        <StateBlock
          title="No conversation service"
          description="The current frontend does not expose provider conversation or unread-message endpoints."
          className="mt-4 border-dashed bg-slate-50 px-4 py-10 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
        />
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <StateBlock
          title="Messaging is not wired yet"
          description="No fake chat messages are rendered. Once a conversation API exists, this panel can show the active customer thread."
          className="border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
        />
      </div>
    </section>

    <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm dark:border-blue-400/20 dark:from-blue-500/15 dark:via-slate-900 dark:to-cyan-500/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
          <SendHorizontal className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-slate-50">Ready for future inquiries</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            This route is exposed so provider navigation is complete without pretending messages exist.
          </p>
        </div>
      </div>
    </section>
  </div>
);
