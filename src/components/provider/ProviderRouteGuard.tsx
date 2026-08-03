import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ProviderAccessModal } from "./ProviderAccessModal";

export const ProviderRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // A user is considered a Provider if they have a ROLE_PROVIDER_* role or their profile is APPROVED.
  const isProvider = user?.roles?.some(role => role.startsWith('ROLE_PROVIDER_')) || 
                     user?.providerProfile?.verificationStatus === 'APPROVED';

  if (!isProvider) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#07111f] flex flex-col items-center justify-center">
        {/* We mount the modal and keep the background empty so no Provider content is leaked */}
        <ProviderAccessModal open={true} />
      </div>
    );
  }

  return <>{children}</>;
};
