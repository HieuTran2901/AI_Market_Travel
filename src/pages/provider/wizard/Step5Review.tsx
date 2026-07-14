import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { listingService } from '@/services/listingService';
import { CreateListingRequest } from '@/types/listing';
import { AlertTriangle, CheckCircle2, CreditCard, Eye, FileCheck2, PawPrint, ShieldCheck } from 'lucide-react';

type PolicyDraft = {
  petPolicy: string;
  smokingPolicy: string;
  childrenPolicy: string;
  quietHours: string;
  checkInRules: string;
  paymentMethods: string;
  cancellationPolicy: string;
  refundPolicy: string;
  securityDeposit: string;
  taxesAndFees: string;
  extraCharges: string;
  extraGuestPolicy: string;
  houseRules: string;
  idRequirement: string;
  supportContactNotes: string;
};

const linesToArray = (value?: string) => (value || '')
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);

export const Step5Review: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, setStep, prevStep, resetForm, mode, listingId } = useListingWizard();
  const [policyDraft, setPolicyDraft] = useState({
    petPolicy: (formData.details?.petPolicy as string) || (formData.details?.petFriendly === true ? 'Allowed' : 'Not allowed'),
    smokingPolicy: (formData.details?.smokingPolicy as string) || '',
    childrenPolicy: (formData.details?.childrenPolicy as string) || '',
    quietHours: (formData.details?.quietHours as string) || '',
    checkInRules: (formData.details?.checkInRules as string) || '',
    paymentMethods: (formData.details?.paymentMethods as string) || '',
    cancellationPolicy: (formData.details?.cancellationPolicy as string) || '',
    refundPolicy: (formData.details?.refundPolicy as string) || '',
    securityDeposit: (formData.details?.securityDeposit as string) || '',
    taxesAndFees: (formData.details?.taxesAndFees as string) || '',
    extraCharges: (formData.details?.extraCharges as string) || '',
    extraGuestPolicy: (formData.details?.extraGuestPolicy as string) || '',
    houseRules: Array.isArray(formData.details?.houseRules) ? formData.details.houseRules.join('\n') : '',
    idRequirement: (formData.details?.idRequirement as string) || '',
    supportContactNotes: (formData.details?.supportContactNotes as string) || '',
  });
  
  const createMutation = useMutation({
    mutationFn: async ({ data, submitForReview }: { data: CreateListingRequest; submitForReview: boolean }) => {
      const updatePayload = { ...data } as any;
      delete updatePayload.category;
      const response = mode === 'edit' && listingId
        ? await listingService.updateListing(listingId, updatePayload)
        : await listingService.createListing(data);
      const created = response.data;
      if (submitForReview && created?.id) {
        await listingService.changeStatus(created.id, 'PENDING_REVIEW');
      }
      return response;
    },
    onSuccess: (_, variables) => {
      alert(variables.submitForReview ? 'Listing submitted for approval!' : (mode === 'edit' ? 'Listing updated!' : 'Listing saved as draft!'));
      resetForm();
      navigate('/provider/listings');
    },
    onError: (error: any) => {
      alert(`Failed to create listing: ${error.message || 'Unknown error'}`);
    }
  });

  const updatePolicy = (field: keyof typeof policyDraft, value: string) => {
    setPolicyDraft((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => {
    const policyDetails = {
      ...policyDraft,
      houseRules: linesToArray(policyDraft.houseRules),
      petFriendly: policyDraft.petPolicy.toLowerCase().includes('allow') && !policyDraft.petPolicy.toLowerCase().includes('not'),
    };
    const payload = {
      ...formData,
      details: {
        ...(formData.details || {}),
        ...policyDetails,
      },
    } as CreateListingRequest;
    updateFormData({ details: payload.details });
    return payload;
  };

  const handleSubmit = (submitForReview: boolean) => {
    const payload = buildPayload();
    createMutation.mutate({ data: payload, submitForReview });
  };

  const missingFields = [
    !formData.title ? { label: 'Listing title', step: 1 } : null,
    !formData.shortDesc ? { label: 'Short description', step: 1 } : null,
    !formData.address ? { label: 'Street address', step: 2 } : null,
    !formData.city ? { label: 'City / province', step: 2 } : null,
    !formData.basePrice ? { label: 'Base price', step: 1 } : null,
    !(formData.imageUrls?.length) ? { label: 'At least one listing image', step: 4 } : null,
  ].filter(Boolean) as Array<{ label: string; step: number }>;

  const activeAmenities = (formData.details?.amenities as any[] | undefined)?.filter((item) => item.status !== 'unavailable').length || 0;
  const nearbyCount = (formData.details?.nearbyPlaces as any[] | undefined)?.length || 0;
  const previewImage = formData.coverImageUrl || formData.imageUrls?.[0];

  return (
    <div className="space-y-6">
      <div className="wizard-section-header">
        <div className="flex min-w-0 items-start gap-4">
          <span className="wizard-icon">
            <FileCheck2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Policies & Review</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Confirm structured rules, preview the listing, and submit when ready.</p>
          </div>
        </div>
      </div>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Property policies</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Separate fields keep customer-facing policy cards clear and searchable.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PolicyField label="Pet Policy" icon={PawPrint}>
            <Select value={policyDraft.petPolicy} onChange={(event) => updatePolicy('petPolicy', event.target.value)}>
              <option value="Not allowed">Not allowed</option>
              <option value="Allowed">Allowed</option>
              <option value="Allowed with provider approval">Allowed with provider approval</option>
            </Select>
          </PolicyField>
          <PolicyInput label="Smoking Policy" field="smokingPolicy" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Children Policy" field="childrenPolicy" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Quiet Hours" field="quietHours" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="ID Requirement" field="idRequirement" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Extra Guest Policy" field="extraGuestPolicy" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <div className="space-y-2 md:col-span-2">
            <Label>Check-in / Check-out Rules</Label>
            <Textarea rows={3} value={policyDraft.checkInRules} onChange={(event) => updatePolicy('checkInRules', event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>House Rules</Label>
            <Textarea rows={4} value={policyDraft.houseRules} onChange={(event) => updatePolicy('houseRules', event.target.value)} placeholder="One rule per line" />
          </div>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Payment and pricing notes</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">These notes support the customer-friendly booking and policy cards.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PolicyInput label="Accepted Payment Methods" field="paymentMethods" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Cancellation Policy" field="cancellationPolicy" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Refund Policy" field="refundPolicy" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Security Deposit" field="securityDeposit" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Taxes and Fees" field="taxesAndFees" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <PolicyInput label="Extra Charges" field="extraCharges" policyDraft={policyDraft} updatePolicy={updatePolicy} />
          <div className="space-y-2 md:col-span-2">
            <Label>Support / Contact Notes</Label>
            <Input value={policyDraft.supportContactNotes} onChange={(event) => updatePolicy('supportContactNotes', event.target.value)} />
          </div>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 ring-1 ring-violet-200">
              <Eye className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950">Final listing preview</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">A compact preview using the same saved data shape as Listing Detail.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 rounded-xl border-blue-100 bg-white text-xs font-bold text-blue-700">
            Preview
          </Button>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-blue-100 bg-white shadow-sm">
          {previewImage ? (
            <img src={previewImage} alt="Listing cover preview" className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-44 items-center justify-center bg-blue-50 text-sm font-bold text-blue-500">Add a cover image to preview the gallery</div>
          )}
          <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black text-slate-950">{formData.title || 'Untitled listing'}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{formData.city || 'City'}, {formData.country || 'Country'}</p>
              </div>
              <div className="shrink-0 rounded-2xl bg-blue-50 px-4 py-3 text-right">
                <p className="text-xl font-black text-blue-700">{formData.basePrice?.toLocaleString('vi-VN') || 0} {formData.currency}</p>
                <p className="text-xs font-bold text-blue-500">Base price</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{formData.description || formData.shortDesc || 'Add a description so travelers can understand this stay.'}</p>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <PreviewMetric label="Overview" value={`${(formData.details?.whyChoosePoints as string[] | undefined)?.length || 0} choice points`} tone="blue" />
              <PreviewMetric label="Amenities" value={`${activeAmenities} visible amenities`} tone="emerald" />
              <PreviewMetric label="Location" value={`${nearbyCount} nearby places`} tone="violet" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${missingFields.length ? 'bg-amber-100 text-amber-600 ring-amber-200' : 'bg-emerald-100 text-emerald-600 ring-emerald-200'} ring-1`}>
            {missingFields.length ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-slate-950">Submission checklist</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{missingFields.length ? 'Complete these required fields before submitting for approval.' : 'All required fields are ready for approval submission.'}</p>
            {missingFields.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <button key={field.label} type="button" className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800 ring-1 ring-amber-200" onClick={() => setStep(field.step)}>
                    {field.label} · Step {field.step}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="wizard-action-bar">
        <Button type="button" variant="outline" onClick={prevStep} disabled={createMutation.isPending}>
          Previous
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => handleSubmit(false)} disabled={createMutation.isPending}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => handleSubmit(true)} disabled={createMutation.isPending || missingFields.length > 0}>
            {createMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const PolicyField = ({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      <Label>{label}</Label>
    </div>
    {children}
  </div>
);

const PolicyInput = ({ label, field, policyDraft, updatePolicy }: {
  label: string;
  field: keyof PolicyDraft;
  policyDraft: PolicyDraft;
  updatePolicy: (field: keyof PolicyDraft, value: string) => void;
}) => (
  <PolicyField label={label}>
    <Input value={policyDraft[field]} onChange={(event) => updatePolicy(field, event.target.value)} />
  </PolicyField>
);

const PreviewMetric = ({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'emerald' | 'violet' }) => {
  const classes = {
    blue: 'bg-blue-50 text-blue-900',
    emerald: 'bg-emerald-50 text-emerald-900',
    violet: 'bg-violet-50 text-violet-900',
  }[tone];
  return (
    <div className={`rounded-2xl p-3 ${classes}`}>
      <p className="font-black">{label}</p>
      <p className="mt-1 text-xs font-bold opacity-75">{value}</p>
    </div>
  );
};
