import Icon from '@components/ui/Icon';
import { ReactNode } from 'react';
import Hoverable from '.';
import { Container } from './HoverableIcon.styles';

const HoverableIcon = ({
  children,
  iconSize,
  iconName,
  position,
  top,
}: {
  children: ReactNode;
  iconSize?: 'xs' | 'sm' | 'lg' | 'md';
  iconName: any;
  position?: React.ComponentProps<typeof Hoverable>['position'];
  top?: string;
}) => {
  return (
    <Container top={top}>
      <Icon size={iconSize} name={iconName} />
      <Hoverable position={position || 'top'}>{children}</Hoverable>
    </Container>
  );
};

export default HoverableIcon;
