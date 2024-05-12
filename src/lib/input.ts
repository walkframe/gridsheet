export const insertNewLineAtCursor = (input: HTMLTextAreaElement) => {
  const selectPoint = input.selectionEnd;
  const before = input.value.slice(0, selectPoint);
  const after = input.value.slice(selectPoint);
  input.value = `${before}\n${after}`;
  input.selectionEnd = before.length + 1;
};
