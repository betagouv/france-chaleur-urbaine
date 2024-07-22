import Link from 'next/link';

import { Container, Separator } from './ClassedNetwork.styles';

const ClassedNetwork = ({ externalLinks }: { externalLinks?: boolean }) => {
  return (
    <Container>
      <img src="/icons/classed-network.svg" alt="" width={60} height={60} />
      <div>
        <b>
          RESEAU
          <br />
          CLASSÉ
        </b>
      </div>
      <Separator />
      <div>
        Une obligation de raccordement s'applique
        <br />
        pour certains bâtiments (
        <Link
          href="/ressources/reseau-classe#contenu"
          target={externalLinks ? '_blank' : undefined}
          rel={externalLinks ? 'noopener noreferrer' : undefined}
        >
          En savoir plus
        </Link>
        )
      </div>
    </Container>
  );
};

export default ClassedNetwork;
