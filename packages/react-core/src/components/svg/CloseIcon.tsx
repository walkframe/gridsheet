import { type IconProps, Base } from './Base';

// https://tabler.io/icons

export const CloseIcon = ({ style, color = 'none', size = 24 }: IconProps) => {
  return (
    <Base style={style} size={size}>
      <path stroke="none" d="M0 0h24v24H0z" fill={color} />
      <path d="M18 6l-12 12" fill={color} />
      <path d="M6 6l12 12" fill={color} />
    </Base>
  );
};
