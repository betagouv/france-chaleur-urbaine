import Link from 'next/link';

import Box from '@components/ui/Box';
import Divider from '@components/ui/Divider';

const ClassedNetwork = ({ externalLinks }: { externalLinks?: boolean }) => {
  return (
    <Box display="flex" alignItems="center">
      <img src="/icons/classed-network.svg" alt="" width={60} height={60} />
      <b>
        RÉSEAU
        <br />
        CLASSÉ
      </b>
      <Divider vertical="56px" />
      <Box>
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
      </Box>
    </Box>
  );
};

export default ClassedNetwork;
