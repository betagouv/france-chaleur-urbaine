import { ReactNode } from 'react';

import { Container } from './hoverable.styles';

export type HoverableProps = {
  children: ReactNode;
  position?: 'top' | 'right' | 'top-centered' | 'bottom' | 'bottom-centered' | 'left';
};
const Hoverable = ({ children, position }: HoverableProps) => {
  return (
    <Container position={position || 'top'} className="hover-info">
      {children}
    </Container>
  );
};

export default Hoverable;
