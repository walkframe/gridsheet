import React from 'react';
import { FunctionGuide } from './FunctionGuide';

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
  if (filteredOptions.length === 0) {
    return null;
  }

  return (
    <ul className="gs-editor-options" style={{ top, left }}>
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
          {(option.isFunction || option.tooltip) && selected === i && (
            <FunctionGuide option={option} />
          )}
        </li>
      ))}
    </ul>
  );
};
