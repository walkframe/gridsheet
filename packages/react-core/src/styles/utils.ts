import { CSSProperties } from 'react';

type BorderStyleValue = string;

interface BorderOptions {
  /**
   * Border CSS value to apply uniformly to all sides.
   * Individual sides (top, right, etc.) will override this if specified.
   *
   * Example: "1px solid #000"
   */
  all?: BorderStyleValue;

  /**
   * Border CSS value for the top side.
   *
   * Example: "2px dashed red"
   */
  top?: BorderStyleValue;

  /**
   * Border CSS value for the right side.
   */
  right?: BorderStyleValue;

  /**
   * Border CSS value for the bottom side.
   */
  bottom?: BorderStyleValue;

  /**
   * Border CSS value for the left side.
   */
  left?: BorderStyleValue;
}

/**
 * Generates a CSSProperties object with individual border styles.
 *
 * - If `all` is provided, it applies the same border style to all sides.
 * - If individual sides (top, right, bottom, left) are specified, they override `all`.
 * - Sides that are not specified will be omitted from the result,
 *   which avoids unintentionally removing existing border styles during re-renders.
 * - The function does not output the shorthand `border` property, only individual sides.
 *
 * @param options Border configuration options.
 * @returns CSSProperties object with border styles.
 *
 * @example
 * makeBorder({ all: "1px solid #000" });
 * // → { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" }
 *
 * @example
 * makeBorder({ top: "2px dashed red", left: "1px solid blue" });
 * // → { borderTop: "2px dashed red", borderLeft: "1px solid blue" }
 */
export function makeBorder(options: BorderOptions): CSSProperties {
  const result: CSSProperties = {};

  const all = options.all;

  if (options.top ?? all) {
    result.borderTop = options.top ?? all;
  }

  if (options.right ?? all) {
    result.borderRight = options.right ?? all;
  }

  if (options.bottom ?? all) {
    result.borderBottom = options.bottom ?? all;
  }

  if (options.left ?? all) {
    result.borderLeft = options.left ?? all;
  }

  return result;
}
