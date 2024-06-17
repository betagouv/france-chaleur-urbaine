import Icon from '@components/ui/Icon';
import { ReactNode } from 'react';
import Hoverable from '.';
import { Container } from './HoverableIcon.styles';

const HoverableIcon = ({
  children,
  iconSize,
  iconName,
  position,
}: {
  children: ReactNode;
  iconSize?: 'xs' | 'sm' | 'lg' | 'md';
  iconName: any;
  position?: 'top' | 'right' | 'top-centered' | 'bottom' | 'bottom-centered';
}) => {
  return (
    <Container>
      <Icon size={iconSize} name={iconName} />
      <Hoverable position={position || 'top'}>{children}</Hoverable>
    </Container>
  );
};

export default HoverableIcon;
