export class Sentinel {
  public readonly __gsType = 'Sentinel' as const;
  constructor(public readonly code: string) {}

  is(obj: any): obj is this {
    return Sentinel.is(obj, this.code);
  }

  static is(obj: any, code?: string): obj is Sentinel {
    const match = obj instanceof Sentinel || obj?.__gsType === 'Sentinel';
    if (!match) {
      return false;
    }
    return code == null || obj.code === code;
  }
}

export const SOLVING = new Sentinel('solving');

/**
 * Sentinel value representing an in-flight async formula computation.
 * Cells whose solved cache contains a Pending will render a loading indicator.
 * Dependent cells that encounter a Pending value also become pending.
 */
export class Pending<T = unknown> {
  private readonly timestamp: number;

  public readonly promise: Promise<T>;
  public readonly __gsType = 'Pending' as const;

  constructor(promise: Promise<T>) {
    this.promise = promise;
    this.timestamp = Date.now();
  }

  static is(obj: any): obj is Pending {
    return obj instanceof Pending || obj?.__gsType === 'Pending';
  }

  toString(): string {
    return `<Pending #${this.timestamp}>`;
  }
}

/**
 * Returned by functions that want to spill a 2D result into adjacent cells.
 *
 * Usage in a function:
 *   return new Spilling([[1, 2], [3, 4]]);
 *
 * The solver detects Spilling via `Spilling.is()` and calls
 * `sheet.spill(origin, result.matrix)` to perform obstruction checks
 * and write values into the solvedCaches.
 */
export class Spilling {
  public readonly __gsType = 'Spilling' as const;
  /** The 2D matrix of resolved values. matrix[row][col] */
  public readonly matrix: any[][];

  constructor(matrix: any[][]) {
    this.matrix = matrix;
  }

  static is(obj: any): obj is Spilling {
    return obj instanceof Spilling || obj?.__gsType === 'Spilling';
  }
}
