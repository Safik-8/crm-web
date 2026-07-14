import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any input value.
 *
 * @param {*} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 400)
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
