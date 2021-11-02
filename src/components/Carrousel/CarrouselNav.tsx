import React, { useMemo } from 'react';
import { NavContainer, NavPoint } from './Carrousel.style';

type CarrouselNavProps = {
  duration?: number;
  size: number;
  selectedPoint?: number;
  onPointSelected?: (nb: number) => void;
};
const CarrouselNav: React.FC<CarrouselNavProps> = ({
  duration = 5,
  size = 0,
  selectedPoint = 0,
  onPointSelected = () => undefined,
}) => {
  const arr = useMemo(() => Array(size).fill(0), [size]);

  return (
    <NavContainer>
      {arr.length > 1 &&
        arr.map((v, i) => (
          <NavPoint
            key={i}
            className={i === selectedPoint ? 'selected' : ''}
            duration={duration}
            onClick={() => onPointSelected(i)}
          />
        ))}
    </NavContainer>
  );
};

export default CarrouselNav;
