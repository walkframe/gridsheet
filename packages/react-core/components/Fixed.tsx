import React, { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useBrowser } from './hooks';

type Props = {
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
  [attr: string]: any;
};

export const Fixed: React.FC<Props> = ({ children, style, className = '', ...attrs }) => {
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
