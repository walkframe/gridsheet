import { type IconProps, Base } from './Base';

// https://tabler.io/icons

export const SearchIcon = ({ style, color = 'none', size = 24 }: IconProps) => {
  return (
    <Base style={style} size={size}>
      <path stroke="none" d="M0 0h24v24H0z" fill={color} />
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" fill={color} />
      <path d="M21 21l-6 -6" fill={color} />
    </Base>
  );
};
