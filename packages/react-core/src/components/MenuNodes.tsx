import { type FC, type ReactNode, useState, useRef, useLayoutEffect } from 'react';
import type { MenuContext } from '../lib/menu';
import { MenuItem, MenuDivider } from './MenuItem';

// Loose structural view of a menu descriptor shared by all three menus (context/row/col).
// The public descriptor unions in menu.ts stay type-safe per menu; this renderer takes the
// trailing coordinate args generically (`[]` / `[x]` / `[y]`) so one implementation drives
// items, dividers, registered components, and nested submenus for every menu.
export type MenuNode = {
  type?: 'item' | 'divider' | 'component' | 'submenu';
  id?: string;
  componentId?: string;
  label?: string | ((ctx: MenuContext, ...args: any[]) => string);
  shortcuts?: string[] | ((ctx: MenuContext, ...args: any[]) => string[]);
  visible?: (ctx: MenuContext, ...args: any[]) => boolean;
  disabled?: (ctx: MenuContext, ...args: any[]) => boolean;
  checked?: (ctx: MenuContext, ...args: any[]) => boolean;
  onClick?: (ctx: MenuContext, ...args: any[]) => void | Promise<void>;
  children?: MenuNode[];
};

type MenuNodesProps = {
  items: MenuNode[];
  ctx: MenuContext;
  /** Trailing coordinate args passed after ctx to every callback: [] | [x] | [y]. */
  args: number[];
  /** Called after a leaf item is chosen, to close the whole menu. */
  onSelect: () => void;
  /** Renders a `type: 'component'` descriptor (e.g. the column menu's sort/filter sections). */
  renderComponent?: (componentId: string, key: number) => ReactNode;
};

/** Renders a list of menu descriptors (with nested submenu support) as `<li>` rows. */
export const MenuNodes: FC<MenuNodesProps> = ({ items, ctx, args, onSelect, renderComponent }) => {
  return (
    <>
      {items.map((d, i) => {
        if (d.type === 'divider') {
          if (d.visible && !d.visible(ctx, ...args)) {
            return null;
          }
          return <MenuDivider key={i} />;
        }
        if (d.type === 'component') {
          if (d.visible && !d.visible(ctx, ...args)) {
            return null;
          }
          return renderComponent && d.componentId ? renderComponent(d.componentId, i) : null;
        }
        if (d.visible && !d.visible(ctx, ...args)) {
          return null;
        }
        const label = typeof d.label === 'function' ? d.label(ctx, ...args) : (d.label ?? '');
        const disabled = d.disabled?.(ctx, ...args) ?? false;
        if (d.type === 'submenu') {
          return (
            <SubmenuNode
              key={i}
              label={label}
              disabled={disabled}
              testId={d.id}
              items={d.children ?? []}
              ctx={ctx}
              args={args}
              onSelect={onSelect}
              renderComponent={renderComponent}
            />
          );
        }
        const shortcuts = typeof d.shortcuts === 'function' ? d.shortcuts(ctx, ...args) : d.shortcuts;
        const checked = d.checked?.(ctx, ...args);
        return (
          <MenuItem
            key={i}
            label={label}
            shortcuts={shortcuts}
            disabled={disabled}
            checked={checked}
            testId={d.id ? `${d.id}-item` : undefined}
            onClick={() => {
              d.onClick?.(ctx, ...args);
              onSelect();
            }}
          />
        );
      })}
    </>
  );
};

type SubmenuNodeProps = {
  label: string;
  disabled: boolean;
  testId?: string;
  items: MenuNode[];
  ctx: MenuContext;
  args: number[];
  onSelect: () => void;
  renderComponent?: (componentId: string, key: number) => ReactNode;
};

const SubmenuNode: FC<SubmenuNodeProps> = ({ label, disabled, testId, items, ctx, args, onSelect, renderComponent }) => {
  const [open, setOpen] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const flyoutRef = useRef<HTMLUListElement>(null);
  // The flyout is position:fixed and placed in viewport coordinates so it can never be
  // clipped by an ancestor. Preferred side is to the right of the parent row; it flips left
  // and clamps vertically when it would spill off the viewport. `null` until measured.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || disabled) {
      setPos(null);
      return;
    }
    const li = liRef.current;
    const fly = flyoutRef.current;
    if (!li || !fly) {
      return;
    }
    const p = li.getBoundingClientRect();
    const f = fly.getBoundingClientRect();
    const margin = 6;
    let left = p.right;
    if (left + f.width > window.innerWidth - margin) {
      left = p.left - f.width; // flip to the left of the parent
      if (left < margin) {
        left = Math.max(margin, window.innerWidth - f.width - margin);
      }
    }
    let top = p.top;
    if (top + f.height > window.innerHeight - margin) {
      top = window.innerHeight - f.height - margin;
    }
    if (top < margin) {
      top = margin;
    }
    setPos({ left, top });
  }, [open, disabled]);

  return (
    <li
      ref={liRef}
      className={`gs-menu-item gs-submenu-parent ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid={testId ? `${testId}-item` : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      // Clicking the parent row opens the flyout (so it also works without hover, e.g. touch)
      // but must never bubble to the menu backdrop, which would close the whole menu.
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
    >
      <div className="gs-menu-name">{label}</div>
      <span className="gs-submenu-arrow">▸</span>
      {open && !disabled && (
        <ul
          ref={flyoutRef}
          className="gs-menu-items gs-submenu-flyout"
          style={{
            position: 'fixed',
            left: pos ? pos.left : -9999,
            top: pos ? pos.top : -9999,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          <MenuNodes items={items} ctx={ctx} args={args} onSelect={onSelect} renderComponent={renderComponent} />
        </ul>
      )}
    </li>
  );
};
