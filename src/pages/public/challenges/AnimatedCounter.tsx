import React, { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className,
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    // Only animate if value actually changes to avoid initial jump from 0
    if (prevValue.current !== value) {
      const controls = animate(prevValue.current, value, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = Math.round(v).toLocaleString("en-US");
        },
      });
      prevValue.current = value;
      return () => controls.stop();
    } else {
      // Set initial value immediately
      node.textContent = Math.round(value).toLocaleString("en-US");
    }
  }, [value]);

  return (
    <motion.span
      ref={nodeRef}
      className={className}
      initial={{ scale: 1, color: "inherit", textShadow: "none" }}
      animate={
        prevValue.current !== value
          ? {
              scale: [1, 1.15, 1],
              color: ["inherit", "#d8b4fe", "inherit"],
              textShadow: [
                "none",
                "0 0 12px rgba(216,180,254,0.8)",
                "none",
              ],
            }
          : {}
      }
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{ display: "inline-block" }}
    />
  );
};
