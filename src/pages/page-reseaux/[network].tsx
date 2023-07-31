import Network from '@components/Network/Network';
import {
  getColdNetwork,
  getNetwork,
} from '@core/infrastructure/repository/network';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

const PageReseau = ({ network }: { network: Network }) => {
  const router = useRouter();
  if (!network) {
    return null;
  }

  const { blocs } = router.query;
  let displayBlocks: string[] | undefined;

  if (typeof blocs === 'string') {
    displayBlocks = blocs.split(',');
  } else if (typeof blocs === 'object') {
    displayBlocks = blocs;
  }

  return <Network network={network} displayBlocks={displayBlocks} />;
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export const getStaticProps: GetStaticProps<{
  network: Network;
}> = async (context) => {
  if (context.params?.network && typeof context.params.network === 'string') {
    const network = await (context.params.network.includes('F')
      ? getColdNetwork(context.params.network)
      : getNetwork(context.params.network));
    if (network) {
      return { props: { network } };
    }
  }

  return {
    redirect: {
      permanent: false,
      destination: '/carte',
    },
  };
};

export default PageReseau;
