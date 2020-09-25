
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const convertNtoA = (num: number): string => {
  let result = "";
  do {
    result = ALPHABET[--num % 26] + result;
    num = Math.floor(num / 26);
  } while(num > 0)
  return result;
};

export const convertAtoN = (alpha: string): number => {
  return 0;
}
