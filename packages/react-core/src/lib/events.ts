
export const isTouching = (e: React.TouchEvent | React.MouseEvent): boolean => {
  if (e.type.startsWith('touch')) {
    return (e as React.TouchEvent).touches.length > 0;
  }
  if (e.type.startsWith('mouse')) {
    return !!((e as React.MouseEvent).buttons & 1);
  }
  return false;
};
