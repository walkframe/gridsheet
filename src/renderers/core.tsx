import React from "react";
import { Writer } from "../types";

type Condition = (value: any) => boolean;
type Stringify = (value: any) => string;

type Props = {
  condition?: Condition;
  complement?: Stringify;
}

export class Renderer {
  private condition?: Condition;
  private complement?: Stringify;

  constructor(props?: Props) {
    if (props == null) {
      return;
    }
    const { condition, complement } = props;
    this.condition = condition;
    this.complement = complement;
  }

  public render (value: any, writer?: Writer): any {
    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify(value);
    }

    switch (typeof value) {
      case "object":
        if (value instanceof Date) {
          return this.date(value, writer);
        }
        if (value == null) {
          return this.null(value, writer);
        }
        if (Array.isArray(value)) {
          return this.array(value, writer);
        }
        return this.object(value, writer);
      case "string":
        return this.string(value, writer);
      case "number":
        return this.number(value, writer);
      case "function":
        return value() as string;
      case "boolean":
        return this.bool(value, writer);
      case "undefined":
        return this.undefined(value, writer);
    }
    return "";
  }

  public stringify(value: any): string {
    if (value instanceof Date) {
      return this.date(value);
    }
    if (value == null) {
      return "";
    }
    return value.toString();
  }

  protected string (value: string, writer?: Writer): any {
    if (value[0] === "'") {
      return value.substring(1);
    }
    return value;
  }

  protected bool (value: boolean, writer?: Writer): any {
    return (
      <input 
        type="checkbox"
        checked={value}
        onChange={(e) => {
          writer && writer(e.currentTarget.checked.toString());
          e.currentTarget.blur();
        }}
      />
    );
  }

  protected number (value: number, writer?: Writer): any {
    if (isNaN(value)) {
      return "NaN";
    }
    return value.toLocaleString();
  }

  protected date (value: Date, writer?: Writer): any {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return value.toLocaleDateString();
    }
    return value.toLocaleString();
  }

  protected array (value: any[], writer?: Writer): any {
    return  value.map((v) => this.stringify(v)).join(",");
  }
  
  protected object (value: any, writer?: Writer): any {
    return "{}";
  }

  protected null (value: null, writer?: Writer): any {
    return "";
  }
  protected undefined (value: undefined, writer?: Writer): any {
    return "";
  }
};

export type RendererType = Renderer;
