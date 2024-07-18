import { ReactNode } from 'react';

import { Container } from './hoverable.styles';

const Hoverable = ({
  children,
  position,
}: {
  children: ReactNode;
  position?: 'top' | 'right' | 'top-centered' | 'bottom' | 'bottom-centered' | 'left';
}) => {
  return (
    <Container position={position || 'top'} className="hover-info">
      {children}
    </Container>
  );
};

export default Hoverable;
