
export class Writer<Inputted = any> {

  public stringify (value: Inputted): string {
    return "" + value;
  }

  public write(value: any, old?: Inputted): any {
    return value;
  }
};

export type WriterType = Writer;
export const defaultWriter = new Writer();
