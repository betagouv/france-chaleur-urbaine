import { type GetStaticPaths } from 'next';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import { FCUMapContextProvider } from '@/components/Map/MapProvider';
import Newsletter from '@/components/ui/Newsletter';
import {
  DetailsCommune,
  franceBounds,
  Map,
  type PotentielCreationReseauPageProps,
  SearchCommune,
  submitDemandeCommuneSansReseau,
} from '@/pages/collectivites-et-exploitants/potentiel-creation-reseau/[[...slug]]';
import { getCommunePotentiel } from '@/server/services/communeAPotentiel';

const Page: React.FC<PotentielCreationReseauPageProps> = ({ commune }) => {
  const bounds = commune?.bounds || franceBounds;
  return (
    <div className="fr-grid-row">
      <Newsletter onSignUp={(email) => submitDemandeCommuneSansReseau(commune, email)} withCheckbox>
        <div className="fr-col-12 fr-col-lg-4 fr-my-2w fr-px-2v fr-px-lg-0 fr-pr-lg-2w">
          {commune ? <DetailsCommune commune={commune} /> : <SearchCommune />}
        </div>
      </Newsletter>
      <div className="fr-col-12 fr-col-lg-8">
        <FCUMapContextProvider
          initialMapConfiguration={createMapConfiguration({
            reseauxDeChaleur: {
              show: !!commune,
            },
            zonesOpportunite: {
              show: !!commune,
            },
            besoinsEnChaleur: !!commune,
            reseauxEnConstruction: !!commune,
            communesFortPotentielPourCreationReseauxChaleur: {
              show: !commune,
            },
          })}
        >
          <Map commune={commune} bounds={bounds} />
        </FCUMapContextProvider>
      </div>
    </div>
  );
};

export const getStaticProps = async ({ params }: { params: { slug?: string } }) => {
  const codeInsee = (params?.slug?.[0] as string)?.split('-')[0];

  const commune = codeInsee ? await getCommunePotentiel(codeInsee) : null;

  if (codeInsee && !commune) {
    return {
      redirect: {
        destination: `/iframes/potentiel-creation-reseau?notify=error:${encodeURIComponent(
          "Désolé, nous n'avons pas trouvé la commune en question. Réessayez avec une autre"
        )}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      commune,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export default Page;
