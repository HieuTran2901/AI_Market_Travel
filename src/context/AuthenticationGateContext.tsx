import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthenticationRequiredModal } from '@/components/auth/AuthenticationRequiredModal';
import { useLocation } from 'react-router-dom';

export type AuthReason = "payment" | "membership" | "booking" | "protected-feature";

interface AuthRequiredEventDetail {
  returnTo?: string;
  reason?: AuthReason;
}

interface AuthenticationGateContextType {
  isOpen: boolean;
  openAuthenticationModal: (options?: { returnTo?: string; reason?: AuthReason }) => void;
  closeAuthenticationModal: () => void;
}

const AuthenticationGateContext = createContext<AuthenticationGateContextType | undefined>(undefined);

export class AuthenticationRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

export const AuthenticationGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState<AuthReason | undefined>(undefined);
  const location = useLocation();

  const openAuthenticationModal = useCallback((options?: { returnTo?: string; reason?: AuthReason }) => {
    setIsOpen((prev) => {
      if (!prev) {
        setReturnTo(options?.returnTo || location.pathname + location.search);
        setReason(options?.reason || "protected-feature");
        return true;
      }
      return prev;
    });
  }, [location]);

  const closeAuthenticationModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleAuthRequired = (event: Event) => {
      const customEvent = event as CustomEvent<AuthRequiredEventDetail>;
      openAuthenticationModal(customEvent.detail);
    };

    window.addEventListener('auth:required', handleAuthRequired);
    return () => {
      window.removeEventListener('auth:required', handleAuthRequired);
    };
  }, [openAuthenticationModal]);

  return (
    <AuthenticationGateContext.Provider value={{ isOpen, openAuthenticationModal, closeAuthenticationModal }}>
      {children}
      <AuthenticationRequiredModal
        open={isOpen}
        onClose={closeAuthenticationModal}
        returnTo={returnTo}
        reason={reason}
      />
    </AuthenticationGateContext.Provider>
  );
};

export const useAuthenticationGate = () => {
  const context = useContext(AuthenticationGateContext);
  if (context === undefined) {
    throw new Error('useAuthenticationGate must be used within an AuthenticationGateProvider');
  }
  return context;
};
