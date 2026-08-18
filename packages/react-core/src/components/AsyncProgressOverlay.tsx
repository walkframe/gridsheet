import { forwardRef, useImperativeHandle, useState } from 'react';

export type AsyncProgressHandle = {
  setProgress: (ratio: number) => void;
};

/**
 * Determinate progress overlay for a chunked async mutation (large fill/paste).
 * Its progress is driven IMPERATIVELY (via the ref) so that a progress tick
 * re-renders only this small component — not the whole grid. Routing progress
 * through the store instead made every tick re-render the (expensive, at deep
 * scroll) grid, so a million-cell fill spent most of its time re-rendering.
 */
export const AsyncProgressOverlay = forwardRef<AsyncProgressHandle, { label: string }>(({ label }, ref) => {
  const [progress, setProgress] = useState(0);
  useImperativeHandle(ref, () => ({ setProgress }), []);
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return (
    <div className="gs-progress-overlay">
      <div className="gs-progress-box">
        <div className="gs-progress-head">
          <span className="gs-loading-spinner" />
          <span>
            {label}… {pct}%
          </span>
        </div>
        <div className="gs-progress-track">
          <div className="gs-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
});
