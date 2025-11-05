// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce any fast-changing value.
 * @param value The value to debounce (e.g., search query)
 * @param delay The delay in milliseconds (e.g., 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes (e.g., user keeps typing)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run if value or delay changes

  return debouncedValue;
}