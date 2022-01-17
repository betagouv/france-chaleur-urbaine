import React from 'react';
import { ImageContainer } from './WrappedBlock.style';

const ImgBlock: React.FC<{
  src?: string;
  alt?: string;
  className?: string;
}> = ({ src, alt = '', className }) => {
  return (
    <ImageContainer className={`fr-col-lg-6 fr-col-md-12 ${className}`}>
      {src && <img src={src} alt={alt} />}
    </ImageContainer>
  );
};

export default ImgBlock;
