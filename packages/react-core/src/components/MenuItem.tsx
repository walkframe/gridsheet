import type { FC } from 'react';

type MenuItemProps = {
  label: string;
  shortcuts?: string[];
  disabled?: boolean;
  /**
   * undefined  → no check column
   * true/false → displayed as a toggle row with a checkmark
   */
  checked?: boolean;
  testId?: string;
  onClick?: () => void;
  className?: string;
};

export const MenuItem: FC<MenuItemProps> = ({
  label,
  shortcuts,
  disabled = false,
  checked,
  testId,
  onClick,
  className,
}) => {
  const hasCheck = checked !== undefined;
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}${className ? ` ${className}` : ''}`}
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
    >
      <div className={`gs-menu-name${hasCheck ? ' gs-row-fixed-toggle' : ''}`}>
        {hasCheck && <span className={`gs-row-fixed-check${checked ? ' gs-row-fixed-active' : ''}`}>✓</span>}
        {label}
      </div>
      {shortcuts != null && shortcuts.length > 0 && (
        <div className="gs-menu-shortcut">
          {shortcuts.map((shortcut, i) => (
            <span key={i}>
              {i > 0 && <span className="gs-menu-shortcut-sep">, </span>}
              <span className="gs-menu-shortcut-badge">
                {shortcut.split('+').map((part, j, arr) =>
                  j < arr.length - 1 ? (
                    <span key={j}>{part}+</span>
                  ) : (
                    <span key={j} className="gs-menu-underline">
                      {part}
                    </span>
                  ),
                )}
              </span>
            </span>
          ))}
        </div>
      )}
    </li>
  );
};

export const MenuDivider: FC = () => <li className="gs-menu-divider" />;
