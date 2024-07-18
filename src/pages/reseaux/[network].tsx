import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import { GetStaticProps } from 'next';

import NetworkPanel from '@components/Network/Network';
import SimplePage from '@components/shared/page/SimplePage';
import Slice from '@components/Slice/Slice';
import { getColdNetwork, getNetwork } from '@core/infrastructure/repository/network';
import { Network } from 'src/types/Summary/Network';

const PageReseau = ({ network }: { network: Network }) => {
  if (!network) {
    return null;
  }

  return (
    <SimplePage currentPage="/carte" mode="public-fullscreen">
      <Slice>
        <Breadcrumb
          currentPageLabel={network['Identifiant reseau']}
          homeLinkProps={{
            href: '/',
          }}
          segments={[
            {
              label: 'Accueil',
              linkProps: {
                href: '/',
              },
            },
            {
              label: 'Cartographie',
              linkProps: {
                href: '/carte',
              },
            },
          ]}
        />
      </Slice>
      <Slice className="fr-mb-4w">
        <NetworkPanel network={network} />
      </Slice>
    </SimplePage>
  );
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
