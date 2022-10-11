import WrappedText from '@components/WrappedText';
import { understandings } from './Understanding.config';
import { Block, Blocks, BlockTitle } from './Understanding.styles';

const Understanding = () => {
  return (
    <WrappedText
      title="Les réseaux de chaleur en pratique : tout comprendre pour se raccorder"
      imgSrc="./img/ressources-middle.png"
      imgAlt=""
      imgClassName="understanding-img"
    >
      <Blocks>
        {understandings.map((understanding) => (
          <Block key={understanding.title}>
            <BlockTitle>{understanding.title}</BlockTitle>
            {understanding.description}
          </Block>
        ))}
      </Blocks>
    </WrappedText>
  );
};

export default Understanding;
