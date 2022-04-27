import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { ImageContainer } from './WrappedBlock.style';

const ImgBlock: React.FC<{
  src?: string;
  alt?: string;
  legend?: string;
  className?: string;
  imgClassName?: string;
  legendClassName?: string;
}> = ({ src, alt = '', legend, className, imgClassName, legendClassName }) => {
  return (
    <ImageContainer className={`fr-col-lg-6 fr-col-md-12 ${className}`}>
      {src && <img src={src} alt={alt} className={imgClassName} />}
      {legend && <MarkdownWrapper value={legend} className={legendClassName} />}
    </ImageContainer>
  );
};

export default ImgBlock;
