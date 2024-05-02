import { Icon } from '@dataesr/react-dsfr';
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
  iconSize?:
    | 'fw'
    | 'xxs'
    | 'xs'
    | 'sm'
    | '1x'
    | 'lg'
    | 'xl'
    | '2x'
    | '3x'
    | '10x';
  iconName: string;
  position?: 'top' | 'right' | 'top-centered' | 'bottom' | 'bottom-centered';
  top?: string;
}) => {
  return (
    <Container top={top}>
      <Icon size={iconSize || '1x'} name={iconName} />
      <Hoverable position={position || 'top'}>{children}</Hoverable>
    </Container>
  );
};

export default HoverableIcon;
