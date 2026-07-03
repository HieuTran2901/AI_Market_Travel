import React, { createContext, useContext, useState } from 'react';
import { CreateListingRequest } from '@/types/listing';

interface WizardContextType {
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  formData: Partial<CreateListingRequest>;
  updateFormData: (data: Partial<CreateListingRequest>) => void;
  resetForm: () => void;
}

const ListingWizardContext = createContext<WizardContextType | undefined>(undefined);

export const ListingWizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateListingRequest>>({
    currency: 'VND',
    imageUrls: [],
    details: {}
  });

  const updateFormData = (data: Partial<CreateListingRequest>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const resetForm = () => {
    setCurrentStep(1);
    setFormData({ currency: 'VND', imageUrls: [], details: {} });
  };

  return (
    <ListingWizardContext.Provider value={{
      currentStep,
      setStep: setCurrentStep,
      nextStep,
      prevStep,
      formData,
      updateFormData,
      resetForm
    }}>
      {children}
    </ListingWizardContext.Provider>
  );
};

export const useListingWizard = () => {
  const context = useContext(ListingWizardContext);
  if (context === undefined) {
    throw new Error('useListingWizard must be used within a ListingWizardProvider');
  }
  return context;
};
