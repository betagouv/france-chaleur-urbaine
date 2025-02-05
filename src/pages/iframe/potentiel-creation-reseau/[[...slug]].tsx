import { type GetStaticPaths } from 'next';

import { clientConfig } from '@/client-config';
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
import cx from '@/utils/cx';

const Logo = ({ className }: { className: string }) => (
  <a
    href={clientConfig.websiteOrigin}
    target="_blank"
    className={cx('items-center !bg-none gap-2 justify-end font text-sm text-faded italic fr-px-2w reset-external', className)}
  >
    <img src="/logo-fcu-with-typo-tight.webp" alt="logo france chaleur urbaine" height={'40px'} className="reset-height" />
  </a>
);

const Page: React.FC<PotentielCreationReseauPageProps> = ({ commune }) => {
  const bounds = commune?.bounds || franceBounds;
  return (
    <>
      <div className="fr-grid-row">
        <Newsletter onSignUp={(email) => submitDemandeCommuneSansReseau(commune, email)} withCheckbox>
          <div className="fr-col-12 fr-col-lg-4 fr-mt-2w">
            <div className="flex flex-col h-full">
              <div className="flex-1 my-5 px-2 lg:px-4">{commune ? <DetailsCommune commune={commune} /> : <SearchCommune />}</div>
              <Logo className="hidden lg:flex mt-5" />
            </div>
          </div>
        </Newsletter>
        <div className="fr-col-12 fr-col-lg-8">
          <div className="mx-2 lg:mx-0 h-full">
            {/* This div is made so that a user can still scroll on mobile */}
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
      </div>
      <Logo className="flex lg:hidden my-5" />
    </>
  );
};

export const getStaticProps = async ({ params }: { params: { slug?: string } }) => {
  const codeInsee = (params?.slug?.[0] as string)?.split('-')[0];

  const commune = codeInsee ? await getCommunePotentiel(codeInsee) : null;

  if (codeInsee && !commune) {
    return {
      redirect: {
        destination: `/iframe/potentiel-creation-reseau?notify=error:${encodeURIComponent(
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
