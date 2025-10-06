import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import NetworkPanel from '@/components/Network/Network';
import SEO from '@/components/SEO';
import { getColdNetwork, getNetwork } from '@/modules/reseaux/server/service';
import type { Network } from '@/types/Summary/Network';

const PageReseau = ({ network }: { network: Network }) => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router]);

  if (!network || !isReady) {
    return null;
  }

  const { blocs } = router.query;
  let displayBlocks: string[] | undefined;

  if (typeof blocs === 'string') {
    displayBlocks = blocs.split(',');
  } else if (typeof blocs === 'object') {
    displayBlocks = blocs;
  }

  return (
    <>
      <SEO noIndex />
      <NetworkPanel network={network} displayBlocks={displayBlocks} externalLinks />
    </>
  );
};

export async function getStaticPaths() {
  return {
    fallback: 'blocking',
    paths: [], // No need to generate static pages for those as they are used as iframes
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
      destination: '/carte',
      permanent: false,
    },
  };
};

export default PageReseau;
