import React, { useState, useEffect } from "react";
import { ProviderAccessModal } from "./ProviderAccessModal";

export const GlobalProviderAccessModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleProviderRequired = () => {
      setIsOpen(true);
    };

    window.addEventListener("provider:required", handleProviderRequired);
    return () => {
      window.removeEventListener("provider:required", handleProviderRequired);
    };
  }, []);

  return <ProviderAccessModal open={isOpen} />;
};
