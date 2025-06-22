export const isTouching = (e: React.TouchEvent | React.MouseEvent): boolean => {
  if (e.type.startsWith('touch')) {
    return (e as React.TouchEvent).touches.length > 0;
  }
  if (e.type.startsWith('mouse')) {
    const mouseEvent = e as React.MouseEvent;
    // left click only
    return !!(mouseEvent.buttons & 1) && mouseEvent.button === 0;
  }
  return false;
};

/**
 * Safely call preventDefault to avoid errors on touch events
 */
export const safePreventDefault = (e: React.MouseEvent | React.TouchEvent): void => {
  if (!e.type.startsWith('touch')) {
    e.preventDefault();
  }
};
