import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import NetworkPanel from '@/components/Network/Network';
import Slice from '@/components/Slice/Slice';
import SimplePage from '@/components/shared/page/SimplePage';
import { getColdNetwork, getNetwork } from '@/modules/reseaux/server/service';
import type { Network } from '@/modules/reseaux/types';

const PageReseau = ({ network }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <SimplePage
      currentPage="/reseaux"
      mode="public-fullscreen"
      title={network.nom_reseau ?? ''}
      description={`Réseau de ${network['Identifiant reseau']?.includes('F') ? 'froid' : 'chaleur'} géré par ${
        network.Gestionnaire
      }, créé en ${network.annee_creation}`}
    >
      <Slice>
        <Breadcrumb
          currentPageLabel={network['Identifiant reseau']}
          homeLinkProps={{
            href: '/',
          }}
          segments={[
            {
              label: 'Liste des réseaux',
              linkProps: {
                href: '/reseaux',
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

/**
 * Rendered on each request: the page follows the admin edits and the yearly imports immediately, and the build does not
 * depend on the database. The pages are listed for search engines by `/server-sitemap.xml`.
 */
export const getServerSideProps: GetServerSideProps<{
  network: Network;
}> = async (context) => {
  const networkId = context.params?.network as string;

  if (!networkId) {
    return {
      redirect: {
        destination: '/reseaux',
        permanent: false,
      },
    };
  }

  const network = await (networkId.includes('F') ? getColdNetwork(networkId) : getNetwork(networkId));

  if (!network) {
    return { notFound: true };
  }

  return { props: { network } };
};

export default PageReseau;
