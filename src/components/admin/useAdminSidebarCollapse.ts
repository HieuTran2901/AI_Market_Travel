import React from 'react';

export const ADMIN_SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';
const WIDTH_DELAY_MS = 40;
const TRANSITION_MS = 260;
const LABEL_REVEAL_DELAY_MS = 100;

export const useAdminSidebarCollapse = () => {
  const initialCollapsed = React.useMemo(() => {
    if (typeof window === 'undefined') return false;

    try {
      return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const [compact, setCompact] = React.useState(initialCollapsed);
  const [labelsHidden, setLabelsHidden] = React.useState(initialCollapsed);
  const [transitioning, setTransitioning] = React.useState(false);
  const timersRef = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Sidebar preference is non-critical.
    }
  }, [collapsed]);

  React.useEffect(() => clearTimers, [clearTimers]);

  const runTransition = React.useCallback((nextCollapsed: boolean) => {
    if (transitioning || nextCollapsed === collapsed) return;

    clearTimers();
    setTransitioning(true);
    setCollapsed(nextCollapsed);

    if (nextCollapsed) {
      setLabelsHidden(true);
      timersRef.current.push(window.setTimeout(() => setCompact(true), WIDTH_DELAY_MS));
    } else {
      setCompact(false);
      setLabelsHidden(true);
      timersRef.current.push(window.setTimeout(() => setLabelsHidden(false), LABEL_REVEAL_DELAY_MS));
    }

    timersRef.current.push(window.setTimeout(() => {
      setCompact(nextCollapsed);
      setLabelsHidden(nextCollapsed);
      setTransitioning(false);
    }, TRANSITION_MS));
  }, [clearTimers, collapsed, transitioning]);

  const toggle = React.useCallback(() => runTransition(!collapsed), [collapsed, runTransition]);
  const expand = React.useCallback(() => runTransition(false), [runTransition]);
  const collapse = React.useCallback(() => runTransition(true), [runTransition]);

  return { collapsed, compact, labelsHidden, transitioning, toggle, expand, collapse };
};
