import React, { useRef, useLayoutEffect, useState } from 'react';
import { FunctionGuide } from './FunctionGuide';
import { clampLeft } from '@gridsheet/core/lib/popup';

interface EditorOptionsProps {
  filteredOptions: any[];
  top: number;
  left: number;
  selected: number;
  onOptionMouseDown: (e: React.MouseEvent<HTMLLIElement>, i: number) => void;
}

export const EditorOptions: React.FC<EditorOptionsProps> = ({
  filteredOptions,
  top,
  left,
  selected,
  onOptionMouseDown,
}) => {
  const ulRef = useRef<HTMLUListElement>(null);
  const [adjustedLeft, setAdjustedLeft] = useState(left);

  useLayoutEffect(() => {
    if (!ulRef.current) {
      return;
    }
    const width = ulRef.current.getBoundingClientRect().width;
    setAdjustedLeft(clampLeft(left, width));
  }, [left, filteredOptions]);

  if (filteredOptions.length === 0) {
    return null;
  }

  return (
    <ul ref={ulRef} className="gs-editor-options" style={{ top, left: adjustedLeft }}>
      {filteredOptions.map((option, i) => (
        <li
          key={i}
          className={`gs-editor-option ${selected === i ? ' gs-editor-option-selected' : ''}`}
          onMouseDown={(e) => onOptionMouseDown(e, i)}
        >
          <div className="gs-editor-option-content">
            <span>{option.label ?? option.value}</span>
            {selected === i && <span className="gs-editor-option-tab">⇥ Tab</span>}
          </div>
          {(option.isFunction || option.tooltip) && selected === i && <FunctionGuide option={option} />}
        </li>
      ))}
    </ul>
  );
};
