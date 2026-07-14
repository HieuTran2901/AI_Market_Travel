import React from 'react';
import { Bell, Languages, Monitor, ShieldCheck } from 'lucide-react';

export const ProviderSettingsPage: React.FC = () => {
  const [compactMode, setCompactMode] = React.useState(() => sessionStorage.getItem('provider-compact-dashboard') === 'true');
  const [emailTips, setEmailTips] = React.useState(() => sessionStorage.getItem('provider-email-tips') !== 'false');

  React.useEffect(() => {
    sessionStorage.setItem('provider-compact-dashboard', String(compactMode));
  }, [compactMode]);

  React.useEffect(() => {
    sessionStorage.setItem('provider-email-tips', String(emailTips));
  }, [emailTips]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Settings</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">Provider settings</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
          Frontend workspace preferences only. No backend account settings are persisted from this page.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SettingCard
          icon={Monitor}
          title="Compact dashboard"
          description="Remember a denser provider workspace preference for this browser session."
          enabled={compactMode}
          onChange={setCompactMode}
        />
        <SettingCard
          icon={Bell}
          title="Provider tips"
          description="Show provider guidance and growth tips in this browser session."
          enabled={emailTips}
          onChange={setEmailTips}
        />
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Languages className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">Language</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            Language switching is currently handled by the main site UI. No provider-specific language API is exposed.
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">Security</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            Password, authentication, and account security continue to use the existing auth flows.
          </p>
        </div>
      </section>
    </div>
  );
};

const SettingCard = ({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
    <div className="flex items-start justify-between gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-6 w-6" />
      </div>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
    <h2 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">{title}</h2>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);
