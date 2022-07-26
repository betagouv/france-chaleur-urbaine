import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { Container, ImageContainer, TextContainer } from './WrappedText.style';

const WrappedText: React.FC<{
  children?: React.ReactNode;
  title?: string;
  body?: string;
  imgSrc?: string;
  imgAlt?: string;
  textClassName?: string;
  imgClassName?: string;
  reverse?: boolean;
  center?: boolean;
}> = ({
  children,
  title,
  body,
  imgSrc,
  imgAlt = '',
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
