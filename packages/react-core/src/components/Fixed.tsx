import type { CSSProperties, FC, ReactNode } from 'react';
import { useBrowser } from './hooks';
import { createPortal } from 'react-dom';

type Props = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  [attr: string]: any;
};

export const Fixed: FC<Props> = ({ children, style, className = '', ...attrs }) => {
  const { document } = useBrowser();
  if (document == null) {
    return null;
  }
  return createPortal(
    <div {...attrs} className={`gs-fixed ${className}`} style={style}>
      {children}
    </div>,
    document.body,
  );
};
