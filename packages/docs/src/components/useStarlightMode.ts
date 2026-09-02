import { useEffect, useState } from 'react';

export type InheritMode = 'inherit-light' | 'inherit-dark';

// Starlight stamps the active theme onto <html data-theme="light|dark">. Our
// embedded GridSheet demos use the transparent "inherit" modes and follow that
// attribute (same idea as the VS Code webview's detectMode, which watches the
// host's theme class). Read it live and re-read on toggle via MutationObserver.
const detect = (): InheritMode => {
  if (typeof document === 'undefined') {
    return 'inherit-light';
  }
  return document.documentElement.dataset.theme === 'dark' ? 'inherit-dark' : 'inherit-light';
};

export const useStarlightMode = (): InheritMode => {
  // SSR / first client render: default to light to avoid a hydration mismatch,
  // then sync to the real theme after mount.
  const [mode, setMode] = useState<InheritMode>('inherit-light');
  useEffect(() => {
    setMode(detect());
    const obs = new MutationObserver(() => setMode(detect()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return mode;
};
