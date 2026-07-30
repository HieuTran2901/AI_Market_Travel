import { useState, useEffect } from 'react';

export const useCoinAnimation = (targetValue: number, duration: number = 800) => {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    if (targetValue === displayValue) return;

    const startValue = displayValue;
    const difference = targetValue - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth slowdown at the end (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      
      const currentVal = Math.round(startValue + difference * easeProgress);
      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]); // Intentionally omitting displayValue from deps to avoid re-triggering

  return displayValue;
};
