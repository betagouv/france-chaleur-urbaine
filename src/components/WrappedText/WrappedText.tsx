import React, { ReactNode } from 'react';

import MarkdownWrapper from '@components/MarkdownWrapper';

import { Container, ImageContainer, TextContainer } from './WrappedText.style';

const WrappedText: React.FC<{
  children?: ReactNode;
  title?: ReactNode;
  body?: string;
  imgSrc?: string;
  imgAlt?: string;
  textClassName?: string;
  imgClassName?: string;
  reverse?: boolean;
  center?: boolean;
}> = ({ children, title, body, imgSrc, imgAlt = '', textClassName, imgClassName, reverse, center }) => {
  return (
    <Container reverse={reverse} center={center}>
      <TextContainer reverse={reverse} className={`${textClassName}--container`}>
        {title && <h2>{title}</h2>}
        {<MarkdownWrapper value={body} className={textClassName} />}
        {children}
      </TextContainer>

      {imgSrc && (
        <ImageContainer className={imgClassName}>
          <img src={imgSrc} alt={imgAlt} />
        </ImageContainer>
      )}
    </Container>
  );
};

export default WrappedText;
