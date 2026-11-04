import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const LenisContext = createContext(null);

export const SmoothScrollProvider = ({ children }) => {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Initialize Lenis with Apple-grade smooth spring physics
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
      infinite: false,
      prevent: (node) => {
        if (!node || node === document.documentElement || node === document.body) return false;
        // Never hijack elements explicitly marked with data-lenis-prevent
        if (node.hasAttribute?.('data-lenis-prevent') || node.closest?.('[data-lenis-prevent]')) {
          return true;
        }
        // Never hijack inner scrollable containers (overflow auto/scroll)
        let curr = node;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          if (
            curr.classList?.contains('overflow-y-auto') ||
            curr.classList?.contains('overflow-auto') ||
            curr.tagName === 'MAIN'
          ) {
            return true;
          }
          const style = window.getComputedStyle(curr);
          if (
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            curr.scrollHeight > curr.clientHeight
          ) {
            return true;
          }
          curr = curr.parentElement;
        }
        return false;
      },
    });

    lenisRef.current = lenis;

    // Animation frame loop
    let animationFrameId;
    const raf = (time) => {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    };

    animationFrameId = requestAnimationFrame(raf);

    // Initial check for current route
    if (location.pathname.startsWith('/admin')) {
      lenis.stop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Adapt scroll behavior on route transition
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
      if (location.pathname.startsWith('/admin')) {
        // Admin workspace uses pinned SaaS shell (main scrolls natively)
        lenisRef.current.stop();
      } else {
        // Student and public pages use smooth window scroll
        lenisRef.current.start();
      }
    }
  }, [location.pathname]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
};

export const useLenis = () => {
  return useContext(LenisContext);
};

