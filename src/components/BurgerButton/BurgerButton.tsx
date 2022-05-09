import React from 'react';
import { BurgerStyle } from './BurgerButton.style';

const BurgerButton = ({
  onClick,
  className,
  title,
}: {
  onClick?: (evt: any) => void;
  className?: string;
  title?: string;
}) => (
  <>
    <BurgerStyle />
    <button
      title={title || 'Menu'}
      className={className}
      type="button"
      onClick={onClick}
    >
      <span className="hamburger-box">
        <span className="hamburger-inner"></span>
      </span>
    </button>
  </>
);

export default BurgerButton;
