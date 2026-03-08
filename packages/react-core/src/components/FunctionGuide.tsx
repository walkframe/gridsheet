import React, { useContext, useRef } from 'react';
import type { FunctionHelp } from '../formula/mapping';
import type { AutocompleteOption } from '../policy/core';
import { Context } from '../store';

type OptionWithGuide = AutocompleteOption & {
  isFunction?: boolean;
  example?: string;
  category?: string;
  helpTexts?: string[];
  helpArgs?: any[];
};

export interface FunctionGuideProps {
  // Option Help Mode (renders in EditorOptions)
  option?: OptionWithGuide;

  // Active Function Highlight Mode (renders floating near cursor)
  activeFunctionGuide?: FunctionHelp;
  activeArgIndex?: number;
  top?: number;
  left?: number;
}

export const FunctionGuide: React.FC<FunctionGuideProps> = ({
  option,
  activeFunctionGuide,
  activeArgIndex = 0,
  top,
  left,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { store } = useContext(Context);
  // Hide the active help when not hovering over the editor, to prevent it from blocking clicks on other options.
  const isHidden = !store.editorHovering;

  if (option) {
    return (
      <div
        className="gs-fn-guide1"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {option.category && option.isFunction && (
          <span className={`gs-fn-guide-category gs-fn-guide-category-${option.category}`}>{option.category}</span>
        )}
        {option.tooltip && (
          <div className="gs-fn-guide1-tooltip">
            {typeof option.tooltip === 'function'
              ? React.createElement(option.tooltip as any, { value: option.value })
              : option.tooltip}
          </div>
        )}
        {option.isFunction && (
          <>
            <div className="gs-fn-guide1-example">{option.example}</div>
            {option.helpTexts && option.helpTexts.length > 0 && (
              <div className="gs-fn-guide1-desc">
                {option.helpTexts.map((text, j) => (
                  <p key={j}>{text}</p>
                ))}
              </div>
            )}
            {option.helpArgs && option.helpArgs.length > 0 && (
              <div className="gs-fn-guide1-args">
                {option.helpArgs.map((arg: any, j: number) => (
                  <div key={j} className="gs-fn-guide1-arg">
                    <span className="gs-fn-guide1-arg-name">{arg.name}</span>
                    {arg.optional && <span className="gs-fn-guide1-arg-opt"> (optional)</span>}
                    {arg.iterable && <span className="gs-fn-guide1-arg-iter">...</span>}
                    <code className="gs-fn-guide1-arg-type">{arg.type?.join(' | ') || 'any'}</code>
                    <span className="gs-fn-guide1-arg-desc"> — {arg.description}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (activeFunctionGuide) {
    return (
      <div
        ref={ref}
        className={`gs-fn-guide2 ${isHidden ? 'gs-fn-guide2-hidden' : ''}`}
        style={top !== undefined && left !== undefined ? { top: top + 4, left } : undefined}
      >
        {activeFunctionGuide.category && (
          <span className={`gs-fn-guide-category gs-fn-guide-category-${activeFunctionGuide.category}`}>
            {activeFunctionGuide.category}
          </span>
        )}
        <div className="gs-fn-guide2-name">{activeFunctionGuide.example}</div>
        <div className="gs-fn-guide2-args-inline">
          {(() => {
            const args = activeFunctionGuide.helpArgs ?? [];
            const numIterable = args.filter((a: any) => a.iterable).length;
            const iterableStart = args.length - numIterable;

            return args.map((arg: any, j: number) => {
              let isActive: boolean;
              if (activeArgIndex < iterableStart) {
                // Cursor is on a fixed (non-iterable) argument
                isActive = activeArgIndex === j;
              } else if (numIterable > 0 && j >= iterableStart) {
                // Cursor is in the iterable zone; cycle through the iterable args
                const offset = (activeArgIndex - iterableStart) % numIterable;
                isActive = j === iterableStart + offset;
              } else {
                isActive = false;
              }
              return (
                <React.Fragment key={j}>
                  {j > 0 ? ', ' : ''}
                  <span className={isActive ? 'gs-active-arg' : ''}>
                    {arg.optional ? '[' : ''}
                    {arg.name}
                    {arg.iterable ? ', ...' : ''}
                    {arg.optional ? ']' : ''}
                  </span>
                </React.Fragment>
              );
            });
          })()}
        </div>
        {(() => {
          const args = activeFunctionGuide.helpArgs ?? [];
          const numIterable = args.filter((a: any) => a.iterable).length;
          const iterableStart = args.length - numIterable;

          let resolvedIndex: number;
          if (activeArgIndex < iterableStart || numIterable === 0) {
            resolvedIndex = Math.min(activeArgIndex, args.length - 1);
          } else {
            const offset = (activeArgIndex - iterableStart) % numIterable;
            resolvedIndex = iterableStart + offset;
          }
          const activeArg = args[resolvedIndex];
          if (!activeArg?.description) {
            return null;
          }
          return (
            <div className="gs-fn-guide2-desc" style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              <p>
                <strong>{activeArg.name}:</strong>{' '}
                <code className="gs-fn-guide2-arg-type">{activeArg.type?.join(' | ') || 'any'}</code>
                {activeArg.description}
              </p>
            </div>
          );
        })()}

        {activeFunctionGuide.helpTexts?.length > 0 && (
          <div className="gs-fn-guide2-desc">
            {activeFunctionGuide.helpTexts.map((text, j) => (
              <p key={j}>{text}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};
