import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { BadgeCheck, Building2, CreditCard, MapPin, UserCircle } from 'lucide-react';
import { providerService } from '@/services/providerService';
import { ProviderUpdateRequest } from '@/types/provider';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const ProviderProfile: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: () => providerService.getMyProfile(),
  });

  const { register, handleSubmit, reset } = useForm<ProviderUpdateRequest>();

  React.useEffect(() => {
    if (data?.data) {
      reset(data.data);
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (updateData: ProviderUpdateRequest) => providerService.updateMyProfile(updateData),
    onSuccess: (res) => {
      alert("Profile updated successfully!");
      reset(res.data);
    },
    onError: (err: any) => {
      alert(err?.message || "Failed to update profile");
    }
  });

  const onSubmit = (formData: ProviderUpdateRequest) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <StateBlock variant="loading" title="Loading profile" description="Fetching your provider profile." className="border-0 bg-white shadow-sm dark:bg-slate-900/90" />;
  }

  const profile = data?.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Profile</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">{profile?.businessName || 'Provider Profile'}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{profile?.email}</p>
            </div>
          </div>
          {profile?.verificationStatus && <StatusBadge kind="provider" status={profile.verificationStatus} />}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ProfileInfo icon={Building2} label="Business type" value={profile?.businessType || 'Not set'} />
        <ProfileInfo icon={MapPin} label="Location" value={[profile?.city, profile?.country].filter(Boolean).join(', ') || 'Not set'} />
        <ProfileInfo icon={BadgeCheck} label="Verification" value={profile?.verificationStatus || 'Not set'} />
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ProfilePanel icon={Building2} title="Business information" description="Supported provider fields from the current profile API.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Business Name"><Input {...register('businessName')} className="h-11 rounded-xl" /></Field>
            <Field label="Business Type"><Input disabled value={profile?.businessType || ''} className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950/60" /></Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea {...register('description')} rows={3} placeholder="Tell customers about your business..." className="rounded-xl" />
            </Field>
            <Field label="Phone Number"><Input {...register('phone')} className="h-11 rounded-xl" /></Field>
            <Field label="Website"><Input {...register('website')} type="url" className="h-11 rounded-xl" /></Field>
          </div>
        </ProfilePanel>

        <ProfilePanel icon={MapPin} title="Location" description="Where your provider business is based.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Street Address" className="md:col-span-2"><Input {...register('address')} className="h-11 rounded-xl" /></Field>
            <Field label="City / Province"><Input {...register('city')} className="h-11 rounded-xl" /></Field>
            <Field label="Country"><Input {...register('country')} className="h-11 rounded-xl" /></Field>
          </div>
        </ProfilePanel>

        <ProfilePanel icon={CreditCard} title="Banking & tax information" description="Payout and tax fields supported by the provider DTO.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tax Code"><Input {...register('taxCode')} className="h-11 rounded-xl" /></Field>
            <Field label="Bank Name"><Input {...register('bankName')} className="h-11 rounded-xl" /></Field>
            <Field label="Account Name"><Input {...register('bankAccountName')} className="h-11 rounded-xl" /></Field>
            <Field label="Account Number"><Input {...register('bankAccountNumber')} className="h-11 rounded-xl" /></Field>
          </div>
        </ProfilePanel>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="h-11 rounded-2xl px-6 font-bold">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const ProfileInfo = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50">{value}</p>
      </div>
    </div>
  </div>
);

const ProfilePanel = ({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) => (
  <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
    <div className="mb-5 flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const Field = ({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) => (
  <div className={`space-y-2 ${className}`}>
    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</Label>
    {children}
  </div>
);
