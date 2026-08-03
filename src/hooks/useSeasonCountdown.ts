import { useState, useEffect } from 'react';

export function useSeasonCountdown(endDateIso: string | undefined) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!endDateIso) {
      setCountdown('');
      return;
    }

    const target = new Date(endDateIso).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('0d 0h 0m 0s');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    // Update immediately
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDateIso]);

  return countdown;
}
