import type { ReactNode, CSSProperties } from 'react';

export interface IconProps {
  style?: CSSProperties;
  color?: string;
  size?: number;
}

interface BaseProps extends IconProps {
  children?: ReactNode;
}

// https://tabler.io/icons

export const Base = ({ style, size = 24, children }: BaseProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 24 24`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className="icon-tabler"
    >
      {children}
    </svg>
  );
};
