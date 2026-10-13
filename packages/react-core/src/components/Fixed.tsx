import type { CSSProperties, FC, ReactNode } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { useBrowser } from '../lib/hooks';
import { createPortal } from 'react-dom';
import { Context } from '../store';

type Props = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  // Carry the sheet's font and --gs-* theme tokens into the portal (menus). It renders
  // under <body>, outside .gs-root1, so it would otherwise get the page's font and none of
  // the tokens — including any the app overrides on .gs-root1. Also keeps touch scrolling
  // on the menu from reaching the page / sheet beneath.
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

// A swipe on a menu overlay must not scroll what's under it. Touch scrolling only goes
// through when it lands in a scrollable part of the menu that can still move that way;
// otherwise iOS would scroll (or rubber-band) the page beneath, sheet included. Backs up
// the CSS (touch-action / overscroll-behavior), which older iOS doesn't fully honor.
const useTouchScrollLock = (enabled: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) {
      return;
    }
    let lastY = 0;
    const onStart = (e: TouchEvent) => {
      lastY = e.touches[0]?.clientY ?? 0;
    };
    const onMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? lastY;
      const dy = y - lastY; // > 0: finger down, content scrolls up
      lastY = y;
      for (let n = e.target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        const { overflowY } = getComputedStyle(n);
        if ((overflowY === 'auto' || overflowY === 'scroll') && n.scrollHeight > n.clientHeight) {
          const canMove = dy > 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight;
          if (canMove) {
            return;
          }
          break;
        }
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
    };
  }, [enabled]);
  return ref;
};

export const Fixed: FC<Props> = ({ children, style, className = '', themed = false, ...attrs }) => {
  const { document } = useBrowser();
  const { store } = useContext(Context);
  const lockRef = useTouchScrollLock(themed);
  if (document == null) {
    return null;
  }
  const theme = themed ? themeOf(store?.rootRef?.current ?? null) : undefined;
  return createPortal(
    <div
      {...attrs}
      ref={lockRef}
      className={`gs-fixed ${className}`}
      style={theme ? { ...theme, ...style } : style}
      data-mode={themed ? store?.mode : attrs['data-mode']}
    >
      {children}
    </div>,
    document.body,
  );
};
