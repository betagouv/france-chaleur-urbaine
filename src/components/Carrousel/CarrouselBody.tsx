import React from 'react';
import { CarrouselBodyChild, CarrouselBodyWrapper } from './Carrousel.style';

type CarrouselBodyProps = {
  selected?: number;
  children?: React.ReactNode;
};

const CarrouselBody: React.FC<CarrouselBodyProps> = ({
  selected = 0,
  children,
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
