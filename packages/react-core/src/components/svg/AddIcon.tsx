import { type IconProps, Base } from './Base';

// https://tabler.io/icons

export const AddIcon = ({ style, color = 'none', size = 24 }: IconProps) => {
  return (
    <Base style={style} size={size}>
      <path stroke="none" d="M0 0h24v24H0z" fill={color} />
      <path d="M12 5l0 14" fill={color} />
      <path d="M5 12l14 0" fill={color} />
    </Base>
  );
};
