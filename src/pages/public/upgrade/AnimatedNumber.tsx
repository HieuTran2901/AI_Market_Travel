import React from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

export type AnimatedNumberProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
  playKey?: string;
  className?: string;
};

const defaultFormatter = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.8,
  prefix = "",
  suffix = "",
  formatter = defaultFormatter,
  playKey,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(shouldReduceMotion ? value : 0);
  const [displayValue, setDisplayValue] = React.useState(
    shouldReduceMotion ? value : 0,
  );
  const hasAnimatedRef = React.useRef(false);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  React.useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.set(value);
      setDisplayValue(value);
      hasAnimatedRef.current = true;
      return;
    }

    if (!hasAnimatedRef.current) {
      motionValue.set(0);
      setDisplayValue(0);
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    hasAnimatedRef.current = true;

    return () => controls.stop();
  }, [duration, motionValue, playKey, shouldReduceMotion, value]);

  return (
    <span
      className={className}
      aria-label={`${prefix}${formatter(value)}${suffix}`}
    >
      <span aria-hidden="true">
        {prefix}
        {formatter(displayValue)}
        {suffix}
      </span>
    </span>
  );
};

