export const focus = (el: HTMLElement | null | undefined) => {
  el?.focus({ preventScroll: true });
};
