import WrappedText from '@components/WrappedText';
import Link from 'next/link';
import { issues } from './config';
import { Block, Blocks, BlockTitle } from './Issues.styles';

const Issues = () => {
  return (
    <WrappedText
      title={
        <>Les enjeux de la transition énergétique avec les réseaux de chaleur</>
      }
      imgSrc="/img/ressources-middle.png"
      imgAlt=""
      imgClassName="issues-img"
    >
      <Blocks>
        {Object.entries(issues).map(([key, issue]) => (
          <Block key={key}>
            <BlockTitle>{issue.title}</BlockTitle>
            {issue.description}
            <br />
            <Link href={`/ressources/${key}`}>Lire l'article</Link>
          </Block>
        ))}
      </Blocks>
    </WrappedText>
  );
};

export default Issues;
