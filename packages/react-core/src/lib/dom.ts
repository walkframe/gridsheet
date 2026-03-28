export const focus = (el: HTMLElement | null | undefined) => {
  el?.focus({ preventScroll: true });
};

const isSafari = (): boolean =>
  typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Prevents Safari elastic bounce (rubber-band) at scroll boundaries.
 * No-op on non-Safari browsers. Returns a cleanup function to remove the listeners.
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

  let touchStartX = 0;
  let touchStartY = 0;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  };

  const preventTouchBounce = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = el;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    const atTop = dy > 0 && scrollTop <= 0;
    const atBottom = dy < 0 && scrollTop + clientHeight >= scrollHeight;
    const atLeft = dx > 0 && scrollLeft <= 0;
    const atRight = dx < 0 && scrollLeft + clientWidth >= scrollWidth;
    if (atTop || atBottom || atLeft || atRight) {
      e.preventDefault();
    }
  };

  el.addEventListener('wheel', preventBounce, { passive: false });
  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', preventTouchBounce, { passive: false });

  return () => {
    el.removeEventListener('wheel', preventBounce);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', preventTouchBounce);
  };
};
