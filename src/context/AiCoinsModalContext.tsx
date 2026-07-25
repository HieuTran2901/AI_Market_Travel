import React, { createContext, useContext, useState, useCallback } from 'react';
import { AiCoinsModal, AiCoinPurchaseStep } from '@/components/payment/AiCoinsModal';
import { useAuth } from './AuthContext';

interface AiCoinsModalOptions {
  packageId?: string;
  step?: AiCoinPurchaseStep;
}

interface AiCoinsModalContextType {
  isOpen: boolean;
  options: AiCoinsModalOptions;
  openAiCoinsModal: (options?: AiCoinsModalOptions) => void;
  closeAiCoinsModal: () => void;
}

const AiCoinsModalContext = createContext<AiCoinsModalContextType | undefined>(undefined);

export const AiCoinsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AiCoinsModalOptions>({});
  const { user } = useAuth();

  const openAiCoinsModal = useCallback((opts?: AiCoinsModalOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const closeAiCoinsModal = useCallback(() => {
    setIsOpen(false);
    // Add a small delay to clear options so the modal animation finishes without snapping content
    setTimeout(() => {
      setOptions({});
    }, 300);
  }, []);

  return (
    <AiCoinsModalContext.Provider value={{ isOpen, options, openAiCoinsModal, closeAiCoinsModal }}>
      {children}
      <AiCoinsModal
        isOpen={isOpen}
        onForceOpen={openAiCoinsModal}
        onClose={closeAiCoinsModal}
        currentBalance={user?.coinBalance || 0}
        initialPackageId={options.packageId}
        initialStep={options.step}
      />
    </AiCoinsModalContext.Provider>
  );
};

export const useAiCoinsModal = () => {
  const context = useContext(AiCoinsModalContext);
  if (context === undefined) {
    throw new Error('useAiCoinsModal must be used within an AiCoinsModalProvider');
  }
  return context;
};
