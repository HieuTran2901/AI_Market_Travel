import React from 'react';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Location } from './Step2Location';
import { Step3CategoryDetails } from './Step3CategoryDetails';
import { Step4Images } from './Step4Images';
import { Step5Review } from './Step5Review';
import { Button } from '@/components/ui/Button';
import { Building2, Check, Save } from 'lucide-react';

const steps = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Location' },
  { id: 3, name: 'Details' },
  { id: 4, name: 'Images' },
  { id: 5, name: 'Review' }
];

export const ListingWizard: React.FC = () => {
  const { currentStep, setStep, mode } = useListingWizard();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo />;
      case 2: return <Step2Location />;
      case 3: return <Step3CategoryDetails />;
      case 4: return <Step4Images />;
      case 5: return <Step5Review />;
      default: return <Step1BasicInfo />;
    }
  };

  const completion = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  return (
    <div className="listing-wizard-premium mx-auto w-full max-w-[1180px] px-4 pb-10 pt-5 sm:px-6 lg:pt-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Building2 className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{mode === 'edit' ? 'Edit Listing' : 'Create Listing'}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Share your space and start welcoming travelers.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{completion}% complete</span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Draft autosaved locally</span>
          <Button type="button" variant="outline" className="h-11 rounded-xl border-blue-100 bg-white px-4 text-sm font-bold text-blue-700">
            <Save className="mr-2 h-4 w-4" />
            Save draft & exit
          </Button>
        </div>
      </div>

      <div className="mb-7 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-[640px] items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button
                type="button"
                className="group flex min-w-[92px] flex-col items-center"
                onClick={() => currentStep > step.id && setStep(step.id)}
                disabled={currentStep <= step.id}
              >
                <span className={`
                  flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black shadow-sm transition
                  ${currentStep > step.id ? 'border-blue-600 bg-blue-600 text-white' :
                    currentStep === step.id ? 'border-blue-600 bg-blue-600 text-white shadow-blue-500/25' : 'border-slate-300 bg-slate-50 text-slate-500'}
                `}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </span>
                <span className={`mt-2 text-xs font-bold ${currentStep >= step.id ? 'text-blue-700' : 'text-slate-500'}`}>
                  {step.name}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`mx-4 h-px flex-1 ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
        {renderStep()}
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-slate-400">Your information is secure and only visible to your provider account until publication.</p>
    </div>
  );
};
