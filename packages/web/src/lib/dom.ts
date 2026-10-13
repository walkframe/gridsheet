export const focus = (el: HTMLElement | null | undefined) => {
  el?.focus({ preventScroll: true });
};

const isSafari = (): boolean =>
  typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Prevents Safari elastic bounce (rubber-band) at scroll boundaries for wheel / trackpad
 * scrolling. No-op on non-Safari browsers. Returns a cleanup function to remove the listeners.
 *
 * Touch scrolling is deliberately left native: cancelling a touchmove at an edge makes iOS
 * drop the whole gesture, so a swipe that drifts even slightly toward an edge the grid is
 * already at (e.g. right/down at the initial top-left) wouldn't scroll at all.
 */
export const preventSafariBounce = (el: HTMLDivElement): (() => void) => {
  if (!isSafari()) {
    return () => {};
  }
  const preventBounce = (e: WheelEvent) => {
    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = el;
    const atTop = e.deltaY < 0 && scrollTop <= 0;
    const atBottom = e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight;
    const atLeft = e.deltaX < 0 && scrollLeft <= 0;
    const atRight = e.deltaX > 0 && scrollLeft + clientWidth >= scrollWidth;
    if (atTop || atBottom || atLeft || atRight) {
      e.preventDefault();
      window.scrollBy({ top: e.deltaY, left: e.deltaX, behavior: 'auto' });
    }
  };

  el.addEventListener('wheel', preventBounce, { passive: false });

  return () => {
    el.removeEventListener('wheel', preventBounce);
  };
};
