import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const previousPathnameRef = useRef<string | null>(null);
  const previousHashRef = useRef<string>('');

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const previousScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';

      return () => {
        window.history.scrollRestoration = previousScrollRestoration;
      };
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const previousPathname = previousPathnameRef.current;
      const previousHash = previousHashRef.current;
      const isInitialRender = previousPathname === null;
      const didPathnameChange = previousPathname !== pathname;
      const didHashChange = previousHash !== hash;

      previousPathnameRef.current = pathname;
      previousHashRef.current = hash;

      if (!isInitialRender && !didPathnameChange && !didHashChange) {
        return;
      }

      if (hash) {
        const target = document.getElementById(hash.slice(1));

        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
          return;
        }
      }

      if (isInitialRender || didPathnameChange) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
};
