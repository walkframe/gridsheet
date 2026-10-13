import type { CSSProperties, FC, ReactNode } from 'react';
import { useContext } from 'react';
import { useBrowser } from '../lib/hooks';
import { createPortal } from 'react-dom';
import { Context } from '../store';

type Props = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  // Carry the sheet's font and --gs-* theme tokens into the portal (menus). It renders
  // under <body>, outside .gs-root1, so it would otherwise get the page's font and none of
  // the tokens — including any the app overrides on .gs-root1.
  themed?: boolean;
  [attr: string]: any;
};

const TOKENS = [
  '--gs-fg',
  '--gs-muted-fg',
  '--gs-border',
  '--gs-surface',
  '--gs-editor-surface',
  '--gs-header-bg',
  '--gs-header-fg',
  '--gs-accent',
];

const themeOf = (root: HTMLElement | null): CSSProperties => {
  if (!root) {
    return {};
  }
  const cs = getComputedStyle(root);
  const theme: Record<string, string> = { fontFamily: cs.fontFamily };
  for (const token of TOKENS) {
    const value = cs.getPropertyValue(token).trim();
    if (value) {
      theme[token] = value;
    }
  }
  return theme as CSSProperties;
};

export const Fixed: FC<Props> = ({ children, style, className = '', themed = false, ...attrs }) => {
  const { document } = useBrowser();
  const { store } = useContext(Context);
  if (document == null) {
    return null;
  }
  const theme = themed ? themeOf(store?.rootRef?.current ?? null) : undefined;
  return createPortal(
    <div
      {...attrs}
      className={`gs-fixed ${className}`}
      style={theme ? { ...theme, ...style } : style}
      data-mode={themed ? store?.mode : attrs['data-mode']}
    >
      {children}
    </div>,
    document.body,
  );
};
