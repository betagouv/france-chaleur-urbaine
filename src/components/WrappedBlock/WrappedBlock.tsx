import React from 'react';
import ImgBlock from './ImgBlock';
import TextBlock from './TextBlock';
import { Container } from './WrappedBlock.style';

const WrappedText: React.FC<{
  data?: Record<string, unknown>[];
  reverse?: boolean;
  direction?: string;
  className?: string;
}> = ({ children, data, reverse, direction, className }) => {
  const mapFunc = (
    { type, props }: { type?: string; props?: Record<string, unknown> },
    index: number
  ) => {
    const key = index;
    switch (type) {
      case 'image': {
        return <ImgBlock {...{ key, ...props }} />;
      }
      case 'text-block':
      default: {
        return <TextBlock {...{ key, ...props }} />;
      }
    }
  };
  return (
    <Container className={className} reverse={reverse} direction={direction}>
      {children}
      {data && data.map(mapFunc)}
    </Container>
  );
};

export default WrappedText;
