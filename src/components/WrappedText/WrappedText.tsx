import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { Container, ImageContainer, TextContainer } from './WrappedText.style';

const WrappedText: React.FC<{
  title?: string;
  body?: string;
  imgSrc?: string;
  imgAlt?: string;
  textClassName?: string;
  imgClassName?: string;
  reverse?: boolean;
  center?: boolean;
}> = ({
  title,
  body,
  imgSrc,
  imgAlt = '',
  children,
  textClassName,
  imgClassName,
  reverse,
  center,
}) => {
  return (
    <Container reverse={reverse} center={center}>
      <TextContainer
        reverse={reverse}
        className={`${textClassName}--container`}
      >
        {title && <h2>{title}</h2>}
        {<MarkdownWrapper value={body} className={textClassName} />}
        {children}
      </TextContainer>

      <ImageContainer className={imgClassName}>
        {imgSrc && <img src={imgSrc} alt={imgAlt} />}
      </ImageContainer>
    </Container>
  );
};

export default WrappedText;
