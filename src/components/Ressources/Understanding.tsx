import WrappedText from '@components/WrappedText';
import Link from 'next/link';
import { understandings } from './config';
import { Block, Blocks, BlockTitle } from './Understanding.styles';

const Understanding = () => {
  return (
    <WrappedText
      title={
        <>
          Les réseaux de chaleur en pratique :
          <br />
          tout comprendre pour se raccorder
        </>
      }
      imgSrc="/img/ressources-middle.png"
      imgAlt=""
      imgClassName="understanding-img"
    >
      <Blocks>
        {Object.entries(understandings).map(([key, understanding]) => (
          <Block key={key}>
            <BlockTitle>{understanding.title}</BlockTitle>
            {understanding.description}
            <br />
            <Link href={`/ressources/${key}`}>Lire l'article</Link>
          </Block>
        ))}
      </Blocks>
    </WrappedText>
  );
};

export default Understanding;
