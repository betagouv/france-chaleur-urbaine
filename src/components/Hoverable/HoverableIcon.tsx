import { ReactNode } from 'react';

import Icon from '@components/ui/Icon';

import { Container } from './HoverableIcon.styles';

import Hoverable from '.';

const HoverableIcon = ({
  children,
  iconSize = 'sm',
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
