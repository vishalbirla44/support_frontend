import { useState, useEffect } from "react";

/**
 * useDebounce(value, delay)
 * Returns a debounced version of value that only updates after `delay` ms of inactivity.
 * Default delay: 400ms (as specified for AllChats search).
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}