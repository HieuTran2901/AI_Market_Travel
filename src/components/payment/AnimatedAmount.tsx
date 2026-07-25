import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';

type AnimatedAmountProps = {
  value: number;
  currency: string;
  duration?: number;
};

const formatPaymentAmount = (amount: number, currency?: string) => {
  const normalizedCurrency = (currency || '').toUpperCase();
  const isCoins = normalizedCurrency === 'AI_COINS' || normalizedCurrency === 'AI_COIN';

  if (isCoins) return `${Math.round(amount).toLocaleString('en-US')} AI Coins`;
  if (normalizedCurrency === 'VND') return `${Math.round(amount).toLocaleString('en-US')} VND`;
  if (normalizedCurrency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};

export const AnimatedAmount: React.FC<AnimatedAmountProps> = ({ value, currency, duration = 1.2 }) => {
  const shouldReduceMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      springValue.set(value);
      setHasAnimated(true);
    } else if (!hasAnimated) {
      springValue.set(value);
      setHasAnimated(true);
    }
  }, [value, shouldReduceMotion, springValue, hasAnimated]);

  const displayValue = useTransform(springValue, (current) => 
    formatPaymentAmount(current, currency)
  );

  return <motion.span>{displayValue}</motion.span>;
};
