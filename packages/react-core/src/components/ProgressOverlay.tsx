import type { FC } from 'react';

export type ProgressOverlayProps = {
  /** 0..1 for a determinate bar; null/undefined for an indeterminate spinner. */
  progress?: number | null;
  /** Text shown before the percentage (e.g. "Loading", "Saving", "Pasting"). */
  label?: string;
};

/**
 * Shared progress overlay: a centered card with a spinner + label, plus a determinate bar
 * when `progress` is given. One component for initial loading, save, and chunked async
 * mutations so every progress indicator looks and behaves the same. It spans its (positioned)
 * container to capture pointer events — blocking interaction while work runs — but does NOT
 * dim, so the grid stays visible behind it. Drive it with a prop for cheap/occasional updates
 * (load/save); for a high-frequency mutation tick use AsyncProgressOverlay's imperative handle
 * so a tick re-renders only the overlay, not the grid.
 */
export const ProgressOverlay: FC<ProgressOverlayProps> = ({ progress, label = 'Loading' }) => {
  const determinate = progress != null;
  const pct = determinate ? Math.max(0, Math.min(100, Math.round(progress * 100))) : 0;
  return (
    <div className="gs-progress-overlay">
      <div className="gs-progress-box">
        <div className="gs-progress-head">
          <span className="gs-loading-spinner" />
          <span>{determinate ? `${label}… ${pct}%` : `${label}…`}</span>
        </div>
        {determinate && (
          <div className="gs-progress-track">
            <div className="gs-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};
