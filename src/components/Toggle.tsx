import React from 'react';

type Props = {
  defaultChecked?: boolean;
  width?: number;
  on: string;
  off: string;
  coloring?: boolean;
  onChange: (on: boolean) => void;
};

export const Toggle: React.FC<Props> = ({ defaultChecked = false, width = 45, on, off, coloring = true, onChange }) => {
  return (
    <label
      className={`gs-ui-toggle ${coloring ? 'gs-ui-toggle-colored' : ''}`}
      style={{
        width,
      }}
    >
      <input
        defaultChecked={defaultChecked}
        type="checkbox"
        data-text-on={on}
        data-text-off={off}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
};
