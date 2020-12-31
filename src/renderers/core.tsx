import React from "react";
import { Writer } from "../types";


export class Renderer {
  protected value: any;

  constructor(value: any) {
    this.value = value;
  }

  public render (writer?: Writer): any {
    switch (typeof this.value) {
      case "object":
        if (this.value instanceof Date) {
          return this.date(this.value, writer);
        }
        if (this.value == null) {
          return this.null(this.value, writer);
        }
        if (Array.isArray(this.value)) {
          return this.array(this.value, writer);
        }
        return this.object(this.value, writer);
      case "string":
        return this.string(this.value, writer);
      case "number":
        return this.number(this.value, writer);
      case "function":
        return this.value() as string;
      case "boolean":
        return this.bool(this.value, writer);
      case "undefined":
        return this.undefined(this.value, writer);
    }
    return "";
  }
  public stringify(): string {
    if (this.value instanceof Date) {
      return this.date(this.value);
    }
    if (this.value == null) {
      return "";
    }
    return this.value.toString();
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
        defaultChecked={value}
        onChange={(e) => {
          writer && writer(e.currentTarget.checked.toString());
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
    return value.map((v) => new Renderer(v).render(writer)).join(",");
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

export type RendererType = typeof Renderer;
