import React from 'react';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Location } from './Step2Location';
import { Step3CategoryDetails } from './Step3CategoryDetails';
import { Step4Images } from './Step4Images';
import { Step5Review } from './Step5Review';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Location' },
  { id: 3, name: 'Details' },
  { id: 4, name: 'Images' },
  { id: 5, name: 'Review' }
];

export const ListingWizard: React.FC = () => {
  const { currentStep } = useListingWizard();

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 
                  ${currentStep > step.id ? 'bg-blue-600 border-blue-600 text-white' : 
                    currentStep === step.id ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'}
                `}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-xl pb-4">
          <CardTitle>{steps.find(s => s.id === currentStep)?.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};
