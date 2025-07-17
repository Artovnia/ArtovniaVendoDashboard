import { useEffect, useRef } from 'react';

/**
 * Custom hook for setting up intervals that are properly cleaned up on unmount
 * 
 * @param callback - Function to call on the interval
 * @param delay - Delay in ms, or null to pause the interval
 */
export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if no delay is specified or if delay is null
    if (delay === null) return;
    
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
};
