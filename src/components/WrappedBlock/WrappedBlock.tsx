import React from 'react';
import ImgBlock from './ImgBlock';
import TextBlock from './TextBlock';
import { Container } from './WrappedBlock.style';

const WrappedText: React.FC<{
  data: Record<string, unknown>[];
  reverse?: boolean;
}> = ({ data, reverse }) => {
  const mapFunc = (
    { type, props }: { type?: string; props?: Record<string, unknown> },
    index: number
  ) => {
    const key = index;
    switch (type) {
      case 'text-block': {
        return <TextBlock {...{ key, ...props }} />;
      }
      case 'image': {
        return <ImgBlock {...{ key, ...props }} />;
      }
    }
  };
  return (
    <Container
      className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-grid-row--middle fr-my-4w"
      reverse={reverse}
    >
      {data && data.map(mapFunc)}
    </Container>
  );
};

export default WrappedText;
