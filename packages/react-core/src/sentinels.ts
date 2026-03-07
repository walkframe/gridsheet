export class Sentinel {
  public readonly __isSentinel = true;
  constructor(public readonly code: string) {}

  is(obj: any): obj is this {
    return Sentinel.is(obj, this.code);
  }

  static is(obj: any, code?: string): obj is Sentinel {
    const match = obj instanceof Sentinel || obj?.__isSentinel === true;
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
  private static counter = 1;
  private readonly id: number;

  public readonly promise: Promise<T>;
  public readonly __isPending = true;

  constructor(promise: Promise<T>) {
    this.promise = promise;
    this.id = ++Pending.counter;
    if (this.id === Number.MAX_SAFE_INTEGER) {
      Pending.counter = 1;
    }
  }

  static is(obj: any): obj is Pending {
    return obj instanceof Pending || obj?.__isPending === true;
  }

  toString(): string {
    return `<Pending #${this.id}>`;
  }
}
