import Network from '@components/Network/Network';
import Slice from '@components/Slice/Slice';
import SimplePage from '@components/shared/page/SimplePage';
import {
  getColdNetwork,
  getNetwork,
} from '@core/infrastructure/repository/network';
import { Breadcrumb, BreadcrumbItem } from '@dataesr/react-dsfr';
import { GetStaticProps } from 'next';
import Link from 'next/link';

const PageReseau = ({ network }: { network: Network }) => {
  if (!network) {
    return null;
  }

  return (
    <SimplePage currentPage="/carte" mode="public-fullscreen">
      <Slice>
        <Breadcrumb>
          <BreadcrumbItem asLink={<Link href="/" />}>Accueil</BreadcrumbItem>
          <BreadcrumbItem asLink={<Link href="/carte" />}>
            Cartographie
          </BreadcrumbItem>
          <BreadcrumbItem>{network['Identifiant reseau']}</BreadcrumbItem>
        </Breadcrumb>
      </Slice>
      <Slice className="fr-mb-4w">
        <Network network={network} />
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
