import React from 'react';
import { ListingWizardProvider } from '@/context/ListingWizardContext';
import { ListingWizard } from './ListingWizard';

export const CreateListingPage: React.FC = () => {
  return (
    <ListingWizardProvider>
      <ListingWizard />
    </ListingWizardProvider>
  );
};
