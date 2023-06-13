import Network from '@components/Network/Network';
import Slice from '@components/Slice/Slice';
import MainContainer from '@components/shared/layout/MainContainer';
import { getNetwork } from '@core/infrastructure/repository/network';
import { Breadcrumb, BreadcrumbItem } from '@dataesr/react-dsfr';
import { GetStaticProps } from 'next';
import Link from 'next/link';

const PageReseau = ({ network }: { network: Network }) => {
  if (!network) {
    return null;
  }

  return (
    <MainContainer currentMenu={'/carte'} fullscreen>
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
    </MainContainer>
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
    const network = await getNetwork(context.params.network);
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
