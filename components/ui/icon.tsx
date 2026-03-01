import * as Iconoir from 'iconoir-react-native';

type IconName = keyof typeof Iconoir;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color = '#A1A1AA', strokeWidth = 1.5 }: IconProps) {
  const IconComponent = Iconoir[name] as React.ComponentType<{
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
  }>;

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent width={size} height={size} color={color} strokeWidth={strokeWidth} />
  );
}
