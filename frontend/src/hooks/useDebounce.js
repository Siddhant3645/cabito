// /frontend/src/hooks/useDebounce.js (Complete New File)

import { useState, useEffect } from 'react';

/**
 * A custom hook to delay updating a value until a certain amount of time has passed.
 * @param {any} value - The value to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value or delay changes, or if the component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}