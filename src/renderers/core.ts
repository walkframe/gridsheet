


export class Renderer {
  private value: any;

  constructor(value: any) {
    this.value = value;
  }

  public render (): string {
    switch (typeof this.value) {
      case "object":
        if (this.value instanceof Date) {
          return this.date(this.value);
        }
        if (this.value == null) {
          return this.null(this.value);
        }
        if (Array.isArray(this.value)) {
          return this.array(this.value);
        }
        return this.object(this.value);
      case "string":
        return this.string(this.value);
      case "number":
        return this.number(this.value);
      case "function":
        return this.value() as string;
      case "boolean":
        return this.bool(this.value);
      case "undefined":
        return this.undefined(this.value);
    }
    return "";
  }
  public renderEditing(): string {
    if (this.value instanceof Date) {
      return this.date(this.value);
    }
    return this.value;
  }

  private string (value: string): string {
    return value;
  }

  private bool (value: boolean): string {
    return value ? "TRUE" : "FALSE";
  }

  private number (value: number): string {
    if (isNaN(value)) {
      return "NaN";
    }
    return value.toLocaleString();
  }

  private date (value: Date): string {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return value.toLocaleDateString();
    }
    return value.toLocaleString();
  }

  private array (value: any[]): string {
    return value.map((v) => new Renderer(v).render()).join(",");
  }
  private object (value: any): string {
    return "{}";
  }

  private null (value: null): string {
    return "";
  }
  private undefined (value: undefined): string {
    return "";
  }


};