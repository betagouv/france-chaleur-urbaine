import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import { type GetStaticPaths, type GetStaticProps, type InferGetStaticPropsType } from 'next';

import NetworkPanel from '@/components/Network/Network';
import SimplePage from '@/components/shared/page/SimplePage';
import Slice from '@/components/Slice/Slice';
import { db } from '@/server/db/kysely';
import { getColdNetwork, getNetwork } from '@/server/services/network';
import { type Network } from '@/types/Summary/Network';

const PageReseau = ({ network }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <SimplePage
      currentPage="/reseaux"
      mode="public-fullscreen"
      title={network.nom_reseau}
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

export const getStaticPaths: GetStaticPaths = async () => {
  const networks = process.env.GITHUB_CI
    ? []
    : await db
        .selectFrom('reseaux_de_chaleur')
        .select('Identifiant reseau')
        .where('Identifiant reseau', 'is not', null)
        .union(db.selectFrom('reseaux_de_froid').select('Identifiant reseau').where('Identifiant reseau', 'is not', null))
        .execute();

  return {
    paths: networks.map((network) => ({ params: { network: network['Identifiant reseau'] ?? undefined } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<{
  network: Network;
}> = async (context) => {
  const networkId = context.params?.network as string;

  if (!networkId) {
    return {
      redirect: {
        permanent: false,
        destination: '/reseaux',
      },
    };
  }

  const network = await (networkId.includes('F') ? getColdNetwork(networkId) : getNetwork(networkId));

  if (!network) {
    return {
      notFound: true,
    };
  }

  return { props: { network } };
};

export default PageReseau;
