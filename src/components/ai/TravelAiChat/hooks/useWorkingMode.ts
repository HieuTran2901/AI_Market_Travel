import { useState, useCallback } from 'react';

export const useWorkingMode = () => {
  const [workingMode, setWorkingMode] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const applyWorkingMode = useCallback((mode: boolean) => {
    setWorkingMode(mode);
    if (mode) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } else {
      setShowToast(false);
    }
  }, []);

  return {
    workingMode,
    showToast,
    applyWorkingMode
  };
};
