import React, { useContext, useLayoutEffect, useRef } from 'react';
import type { FunctionHelp } from '@gridsheet/core/formula/mapping';
import type { AutocompleteOption } from '@gridsheet/core/policy/core';
import { Context } from '../store';
import { calcSideStyle, clampPopup } from '@gridsheet/core/lib/popup';

type OptionWithGuide = AutocompleteOption & {
  isFunction?: boolean;
  example?: string;
  category?: string;
  description?: string;
  defs?: any[];
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
  const guide1Ref = useRef<HTMLDivElement>(null);
  const { store } = useContext(Context);
  // Hide the active help when not hovering over the editor, to prevent it from blocking clicks on other options.
  const isHidden = !store.editorHovering;

  useLayoutEffect(() => {
    const el = guide1Ref.current;
    if (!el) {
      return;
    }
    calcSideStyle(el);
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || left === undefined) {
      return;
    }
    clampPopup(el);
  });

  if (option) {
    return (
      <div
        ref={guide1Ref}
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
            {option.description && (
              <div className="gs-fn-guide1-desc" style={{ whiteSpace: 'pre-line' }}>
                {option.description}
              </div>
            )}
            {option.defs && option.defs.length > 0 && (
              <div className="gs-fn-guide1-args">
                {option.defs.map((arg: any, j: number) => (
                  <div key={j} className="gs-fn-guide1-arg">
                    <span className="gs-fn-guide1-arg-name">{arg.name}</span>
                    {arg.optional && <span className="gs-fn-guide1-arg-opt"> (optional)</span>}
                    {arg.variadic && <span className="gs-fn-guide1-arg-iter">...</span>}
                    <code className="gs-fn-guide1-arg-type">{arg.acceptedTypes?.join(' | ') || 'any'}</code>
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
            const args = activeFunctionGuide.defs ?? [];
            const numIterable = args.filter((a: any) => a.variadic).length;
            const variadicStart = args.length - numIterable;

            return args.map((arg: any, j: number) => {
              let isActive: boolean;
              if (activeArgIndex < variadicStart) {
                // Cursor is on a fixed (non-variadic) argument
                isActive = activeArgIndex === j;
              } else if (numIterable > 0 && j >= variadicStart) {
                // Cursor is in the variadic zone; cycle through the variadic args
                const offset = (activeArgIndex - variadicStart) % numIterable;
                isActive = j === variadicStart + offset;
              } else {
                isActive = false;
              }
              return (
                <React.Fragment key={j}>
                  {j > 0 ? ', ' : ''}
                  <span className={isActive ? 'gs-active-arg' : ''}>
                    {arg.optional ? '[' : ''}
                    {arg.name}
                    {arg.variadic ? ', ...' : ''}
                    {arg.optional ? ']' : ''}
                  </span>
                </React.Fragment>
              );
            });
          })()}
        </div>
        {(() => {
          const args = activeFunctionGuide.defs ?? [];
          const numIterable = args.filter((a: any) => a.variadic).length;
          const variadicStart = args.length - numIterable;

          let resolvedIndex: number;
          if (activeArgIndex < variadicStart || numIterable === 0) {
            resolvedIndex = Math.min(activeArgIndex, args.length - 1);
          } else {
            const offset = (activeArgIndex - variadicStart) % numIterable;
            resolvedIndex = variadicStart + offset;
          }
          const activeArg = args[resolvedIndex];
          if (!activeArg?.description) {
            return null;
          }
          return (
            <div className="gs-fn-guide2-desc" style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              <p>
                <strong>{activeArg.name}:</strong>{' '}
                <code className="gs-fn-guide2-arg-type">{activeArg.acceptedTypes?.join(' | ') || 'any'}</code>
                {activeArg.description}
              </p>
            </div>
          );
        })()}

        {activeFunctionGuide.description && (
          <div className="gs-fn-guide2-desc" style={{ whiteSpace: 'pre-line' }}>
            {activeFunctionGuide.description}
          </div>
        )}
      </div>
    );
  }

  return null;
};
