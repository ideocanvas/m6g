'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current screen is mobile (width <= 768px)
 * Uses the same breakpoint as Tailwind CSS's md breakpoint
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Set initial value
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}