import { useEffect, useState } from 'react';

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
