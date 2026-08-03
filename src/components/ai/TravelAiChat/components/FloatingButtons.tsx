import React, { useEffect, useState, useRef } from 'react';

import { Sparkles } from 'lucide-react';
import { RobotMood } from '../types/chat.types';

// Clamp helper needed by TravelLauncherRobot
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useRobotMood = ({
  isSending,
  error,
  lastCompletedMessageId,
}: {
  isSending: boolean;
  error: boolean;
  lastCompletedMessageId?: string;
}) => {
  const [mood, setMood] = useState<RobotMood>('idle');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousCompletedRef = useRef<string | undefined>(lastCompletedMessageId);

  useEffect(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    if (error) {
      setMood('error');
      errorTimerRef.current = setTimeout(() => {
        setMood('idle');
        errorTimerRef.current = null;
      }, 2800);
      return;
    }

    if (isSending) {
      setMood('thinking');
      return;
    }

    if (lastCompletedMessageId && previousCompletedRef.current !== lastCompletedMessageId) {
      previousCompletedRef.current = lastCompletedMessageId;
      setMood('success');
      successTimerRef.current = setTimeout(() => {
        setMood('idle');
        successTimerRef.current = null;
      }, 1500);
      return;
    }

    setMood('idle');
  }, [error, isSending, lastCompletedMessageId]);

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    },
    []
  );

  return mood;
};

export const TravelLauncherRobot = ({
  mood,
  hasUnread,
  pressed,
  portalActive = false,
}: {
  mood: RobotMood;
  hasUnread: boolean;
  pressed: boolean;
  portalActive?: boolean;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0, tilt: 0 });
  const currentRef = useRef({ x: 0, y: 0, tilt: 0 });
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);

  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const supportsTracking = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !reducedMotion();

  const writeRobotVars = (x: number, y: number, tilt: number) => {
    const node = rootRef.current;
    if (!node) return;
    node.style.setProperty('--eye-x', `${x.toFixed(2)}px`);
    node.style.setProperty('--eye-y', `${y.toFixed(2)}px`);
    node.style.setProperty('--robot-tilt', `${tilt.toFixed(2)}deg`);
  };

  const stopTracking = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const animateTracking = () => {
    const current = currentRef.current;
    const target = targetRef.current;
    current.x += (target.x - current.x) * 0.22;
    current.y += (target.y - current.y) * 0.22;
    current.tilt += (target.tilt - current.tilt) * 0.2;
    writeRobotVars(current.x, current.y, current.tilt);

    if (Math.abs(current.x - target.x) > 0.05 || Math.abs(current.y - target.y) > 0.05 || Math.abs(current.tilt - target.tilt) > 0.05) {
      frameRef.current = requestAnimationFrame(animateTracking);
    } else {
      frameRef.current = null;
    }
  };

  const startTracking = () => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(animateTracking);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!supportsTracking()) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clamp((event.clientX - centerX) / 12, -4, 4);
    const y = clamp((event.clientY - centerY) / 12, -3, 3);
    targetRef.current = { x, y, tilt: clamp((event.clientX - centerX) / 18, -4, 4) };
    startTracking();
  };

  const resetTracking = () => {
    targetRef.current = { x: 0, y: 0, tilt: 0 };
    startTracking();
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof document === 'undefined') return;

    let isVisibleInViewport = true;
    const updatePaused = () => setIsAnimationPaused(document.hidden || !isVisibleInViewport);
    const handleVisibility = () => updatePaused();

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            isVisibleInViewport = entry?.isIntersecting ?? true;
            updatePaused();
          })
        : null;

    observer?.observe(node);
    document.addEventListener('visibilitychange', handleVisibility);
    updatePaused();

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const stateClass = `travel-ai-launcher-robot--${mood} ${hasUnread ? 'travel-ai-launcher-robot--unread' : ''} ${isAnimationPaused ? 'travel-ai-launcher-robot--paused' : ''}`;

  return (
    <div
      ref={rootRef}
      className={`travel-ai-launcher-robot ${stateClass} ${pressed ? 'travel-ai-launcher-robot--pressed' : ''} ${portalActive ? 'travel-ai-launcher-robot--portal' : ''} relative h-12 w-12 shrink-0`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTracking}
      aria-hidden="true"
    >
      <svg className="h-full w-full overflow-visible" viewBox="0 0 64 64" role="img" aria-label="Travel AI robot">
        <defs>
          <linearGradient id="travelRobotShell" x1="9" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="0.52" stopColor="#6366F1" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <radialGradient id="travelRobotFace" cx="50%" cy="42%" r="68%">
            <stop stopColor="#F8FAFC" />
            <stop offset="1" stopColor="#C7D2FE" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="url(#travelRobotShell)" />
        <circle cx="32" cy="32" r="24" fill="rgba(255,255,255,0.22)" />
        <path d="M22 28C22 20.8 26.8 16 32 16C37.2 16 42 20.8 42 28V29H22V28Z" fill="url(#travelRobotFace)" />
        <rect x="18" y="27" width="28" height="21" rx="10" fill="#061A3B" />
        <path d="M27 13L32 8L37 13" fill="none" stroke="#DBEAFE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="7.5" r="2.4" fill="#67E8F9" />
        <g className="travel-ai-launcher-eye-group robot-eyes">
          <ellipse className="travel-ai-launcher-eye travel-ai-launcher-eye-left" cx="27" cy="36" rx="3.8" ry="2.6" fill="#67E8F9" />
          <ellipse className="travel-ai-launcher-eye travel-ai-launcher-eye-right" cx="37" cy="36" rx="3.8" ry="2.6" fill="#67E8F9" />
        </g>
        <path className="travel-ai-robot-mouth travel-ai-robot-mouth--idle" d="M27 43C29.8 45.2 34.4 45.2 37 43" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
        <path className="travel-ai-robot-mouth travel-ai-robot-mouth--success" d="M25.5 42C28.8 46 35.4 46 38.5 42" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" />
        <path className="travel-ai-robot-mouth travel-ai-robot-mouth--error" d="M28 45C30.5 42.8 34.2 42.8 36.5 45" fill="none" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" />
        <g className="travel-ai-robot-keyboard robot-keyboard">
          <rect x="23" y="49" width="18" height="5.5" rx="2" fill="#0EA5E9" opacity="0.9" />
          <path d="M26 51.2H38" stroke="#DBEAFE" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        </g>
        <g className="travel-ai-robot-hand travel-ai-robot-left-hand robot-left-hand">
          <path d="M19 48C22 48.2 24 49.1 26 51" fill="none" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="travel-ai-robot-hand travel-ai-robot-right-hand robot-right-hand">
          <path d="M45 48C42 48.2 40 49.1 38 51" fill="none" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="travel-ai-robot-status-effects robot-status-effects">
          <circle className="travel-ai-robot-success-dot" cx="45" cy="20" r="1.8" fill="#A7F3D0" />
          <path className="travel-ai-robot-error-mark" d="M46 18V23M46 27H46.1" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" />
          <path className="travel-ai-robot-thinking-dot travel-ai-robot-thinking-dot-1" d="M20 20H20.1" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
          <path className="travel-ai-robot-thinking-dot travel-ai-robot-thinking-dot-2" d="M25 18H25.1" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
          <path className="travel-ai-robot-thinking-dot travel-ai-robot-thinking-dot-3" d="M30 20H30.1" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="M12 31H8.5C7.1 31 6 32.1 6 33.5V38" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M52 31H55.5C56.9 31 58 32.1 58 33.5V38" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <Sparkles className="travel-ai-launcher-sparkle travel-ai-launcher-sparkle-one absolute -right-1 top-1 h-3.5 w-3.5 text-cyan-100" />
      <Sparkles className="travel-ai-launcher-sparkle travel-ai-launcher-sparkle-two absolute -left-1 bottom-1 h-3 w-3 text-violet-100" />
    </div>
  );
};
