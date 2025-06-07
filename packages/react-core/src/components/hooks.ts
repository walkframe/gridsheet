import { useEffect, useState, useRef } from 'react';

// Return the document object with SSR.
export const useBrowser = () => {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(true);
  }, []);
  if (ok && typeof window !== 'undefined') {
    return { window, document };
  }
  return { window: null, document: null };
};

export const useDebounce = <T>(value: T, delay = 100) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<number>();

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [value, delay]);
  return debouncedValue;
};

export const useDebounceCallback = (callback: (...args: any[]) => void, delay = 100) => {
  const debouncedCallback = useRef(callback);
  const timerRef = useRef<number>();

  useEffect(() => {
    debouncedCallback.current = callback;
  }, [callback]);

  return (...args: any[]) => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      debouncedCallback.current(...args);
    }, delay);
  };
};
