import { forwardRef, useImperativeHandle, useState } from 'react';
import { ProgressOverlay } from './ProgressOverlay';

export type AsyncProgressHandle = {
  setProgress: (ratio: number) => void;
};

/**
 * Determinate progress overlay for a chunked async mutation (large fill/paste). Its progress
 * is driven IMPERATIVELY (via the ref) so that a progress tick re-renders only this small
 * component — not the whole grid. Routing progress through the store instead made every tick
 * re-render the (expensive, at deep scroll) grid, so a million-cell fill spent most of its
 * time re-rendering. The visuals come from the shared ProgressOverlay.
 */
export const AsyncProgressOverlay = forwardRef<AsyncProgressHandle, { label: string }>(({ label }, ref) => {
  const [progress, setProgress] = useState(0);
  useImperativeHandle(ref, () => ({ setProgress }), []);
  return <ProgressOverlay progress={progress} label={label} />;
});
