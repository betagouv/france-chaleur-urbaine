import { Icon } from '@codegouvfr/react-dsfr';
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
}) => {
  return (
    <Container>
      <Icon size={iconSize || '1x'} name={iconName} />
      <Hoverable position={position || 'top'}>{children}</Hoverable>
    </Container>
  );
};

export default HoverableIcon;
