
export enum Prevention {
  DeleteRow    = 0b00000000000000000000000000000000000000000000000000001,
  DeleteCol    = 0b00000000000000000000000000000000000000000000000000010,
  AddRowAbove  = 0b00000000000000000000000000000000000000000000000000100,
  AddRowBelow  = 0b00000000000000000000000000000000000000000000000001000,
  AddColLeft   = 0b00000000000000000000000000000000000000000000000010000,
  AddColRight  = 0b00000000000000000000000000000000000000000000000100000,
  MoveFrom     = 0b00000000000000000000000000000000000000000000001000000,
  MoveTo       = 0b00000000000000000000000000000000000000000000010000000,
  Write        = 0b00000000000000000000000000000000000000000000100000000,
  Style        = 0b00000000000000000000000000000000000000000001000000000,
  Resize       = 0b00000000000000000000000000000000000000000010000000000,
  SetRenderer  = 0b00000000000000000000000000000000000000000100000000000,
  SetParser    = 0b00000000000000000000000000000000000000001000000000000,
};

export const Move = 
  Prevention.MoveFrom |
  Prevention.MoveTo;

export const Update =
  Prevention.Write |
  Prevention.Style |
  Prevention.Resize |
  Prevention.SetRenderer |
  Prevention.SetParser;

export const AddRow = 
  Prevention.AddRowAbove |
  Prevention.AddRowBelow;

export const AddCol =
  Prevention.AddColLeft |
  Prevention.AddColRight;

export const Add = 
  AddRow |
  AddCol;

export const Delete =
  Prevention.DeleteRow |
  Prevention.DeleteCol;

export const ReadOnly = 
  Update |
  Delete | 
  Add    |
  Move
;

export const isProtected = (protection: number | undefined, flag: Prevention) => {
  if (protection === undefined) {
    return false;
  }
  return (protection & flag) === flag;
};
