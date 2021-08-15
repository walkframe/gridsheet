import React from "react";
import { CommitterType } from "../types";

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

  public render (value: any, committer?: CommitterType): any {
    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify(value);
    }

    switch (typeof value) {
      case "object":
        if (value instanceof Date) {
          return this.date(value, committer);
        }
        if (value == null) {
          return this.null(value, committer);
        }
        if (Array.isArray(value)) {
          return this.array(value, committer);
        }
        return this.object(value, committer);
      case "string":
        return this.string(value, committer);
      case "number":
        return this.number(value, committer);
      case "function":
        return value() as string;
      case "boolean":
        return this.bool(value, committer);
      case "undefined":
        return this.undefined(value, committer);
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

  protected string (value: string, committer?: CommitterType): any {
    if (value[0] === "'") {
      return value.substring(1);
    }
    return value;
  }

  protected bool (value: boolean, committer?: CommitterType): any {
    return (
      <input 
        type="checkbox"
        checked={value}
        onChange={(e) => {
          committer && committer(e.currentTarget.checked.toString());
          e.currentTarget.blur();
        }}
      />
    );
  }

  protected number (value: number, committer?: CommitterType): any {
    if (isNaN(value)) {
      return "NaN";
    }
    const [int, fraction] = String(value).split(".");
    const result = int.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    if (fraction == null) {
      return result;
    }
    return `${result}.${fraction}`;
  }

  protected date (value: Date, committer?: CommitterType): any {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return value.toLocaleDateString();
    }
    return value.toLocaleString();
  }

  protected array (value: any[], committer?: CommitterType): any {
    return  value.map((v) => this.stringify(v)).join(",");
  }
  
  protected object (value: any, committer?: CommitterType): any {
    return "{}";
  }

  protected null (value: null, committer?: CommitterType): any {
    return "";
  }
  protected undefined (value: undefined, committer?: CommitterType): any {
    return "";
  }
};

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
