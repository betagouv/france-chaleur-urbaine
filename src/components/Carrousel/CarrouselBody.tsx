import React from 'react';
import { CarrouselBodyChild, CarrouselBodyWrapper } from './Carrousel.style';

type CarrouselBodyProps = {
  children?: React.ReactNode;
  selected?: number;
};

const CarrouselBody: React.FC<CarrouselBodyProps> = ({
  children,
  selected = 0,
}) => {
  return (
    <CarrouselBodyWrapper>
      {React.Children.map(children, (Child, i) => (
        <CarrouselBodyChild
          className={i === selected ? 'selected' : ''}
          position={i}
        >
          {Child}
        </CarrouselBodyChild>
      ))}
    </CarrouselBodyWrapper>
  );
};

export default CarrouselBody;
