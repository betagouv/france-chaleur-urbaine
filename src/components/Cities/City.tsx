import dynamic from 'next/dynamic';

import Advantages from '@/components/Coproprietaire/Advantages';
import CoproGuide from '@/components/Coproprietaire/CoproGuide';
import Informations from '@/components/Coproprietaire/Informations';
import InterviewsVideos from '@/components/Coproprietaire/InterviewsVideos';
import { ArrowItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import StickyForm from '@/components/StickyForm/StickyForm';
import Hero, { HeroMeta, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import WrappedText from '@/components/WrappedText';
import userExperience from '@/data/villes/user-experience';
import citiesData from '@/data/villes/villes';
import type { Network } from '@/types/Summary/Network';

import ClassedNetworks from './ClassedNetworks';
import Dispositifs, { type DispositifsData } from './Dispositifs';
import Networks from './Networks';

const Simulator = dynamic(() => import('@/modules/simulator/client/Simulator'), {
  ssr: false,
});

const City = ({ citySlug, network }: { citySlug: keyof typeof citiesData; network?: Network }) => {
  const cityData = citiesData[citySlug];
  if (!cityData) return;
  const hasUniqueNetwork = !!cityData.networksData?.identifiant;

  return (
    <>
      <Hero image={`/img/banner_ville_${citySlug}.jpg`} variant="city" className="py-5w" imageClassName="w-screen">
        <HeroMeta>Vous êtes copropriétaire sur {cityData.name} ?</HeroMeta>
        <HeroTitle className="[&&]:font-normal!">
          {/* Use && to bypass DSFR !important by adding specificity*/}
          Le chauffage urbain, une solution <strong>écologique</strong> et <strong>économique</strong> à {cityData.name}
        </HeroTitle>
      </Hero>
      <StickyForm title={`Votre bâtiment est-il raccordable au réseau de chaleur de ${cityData.name} ?`} />
      <div className="fr-container p-4">
        <h2 className="text-blue fr-my-3w">
          {hasUniqueNetwork ? `Votre réseau de chaleur ` : `Vos réseaux de chaleur `}
          <span className="text-[#6060ff]">
            {cityData.preposition} {cityData.nameNetwork}
          </span>
        </h2>
        <div>{cityData.description}</div>
        {cityData.networksData && (
          <div className="fr-p-2w">
            <Networks networksData={cityData.networksData} network={network} cityCoord={cityData.coord as [number, number]} />
          </div>
        )}
      </div>
      <div className="p-8 bg-[#f9f8f6]">
        <div className="fr-container">
          <Advantages />
        </div>
      </div>
      <div className="p-4 bg-[#4550e5]">
        <div className="text-white fr-container">
          <Informations />
        </div>
      </div>
      <div className="fr-container p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 px-4">
          <h3 className="h4 text-blue">Découvrez des témoignages sur le terrain</h3>
          <InterviewsVideos />
        </div>
        <div className="flex-1 px-4">
          <h3 className="h4 text-blue">Le guide complet sur le raccordement</h3>
          <CoproGuide guideClassName="fr-mb-0" />
        </div>
      </div>
      {cityData.networksData?.isClassed && (
        <div className="bg-[#f9f8f6] p-8">
          <div className="fr-container flex flex-col md:flex-row gap-4">
            <ClassedNetworks
              city={citySlug}
              nameNetwork={cityData.nameNetwork}
              allClassed={cityData.networksData?.allClassed}
              isUniqueNetwork={hasUniqueNetwork}
              hasDevelopmentPerimeter={cityData.networksData?.hasDevelopmentPerimeter}
            />
          </div>
        </div>
      )}
      <div className="bg-[#4550e5] p-8">
        <h2 className="text-white text-center">
          Découvrez les dispositifs et les aides
          <br />
          auxquels vous avez droit sur {cityData.name}
        </h2>
        {citySlug === 'paris' && (
          <div className="fr-p-4w">
            <Dispositifs
              city={citySlug}
              dispositifsTitle={cityData.dispositifsTitle}
              dispositifs={cityData.dispositifs as DispositifsData[]}
            />
          </div>
        )}
        <div className="fr-container flex flex-col md:flex-row gap-8 fr-mt-6w">
          <div>
            <h4 className="fr-h4 text-white">Le coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires »</h4>
            <div>
              <ArrowItem color="white">
                Le coup de pouce <strong>«&nbsp;Chauffage des bâtiments résidentiels collectifs et tertiaires&nbsp;»</strong> permet
                d’obtenir des aides financières conséquentes pour se raccorder.
              </ArrowItem>
              <ArrowItem color="white">
                <strong className="bg-[#F8D86E] text-blue">
                  Le coût du raccordement peut ainsi être réduit à quelques centaines d’euros par logement
                </strong>{' '}
                (en fonction de la situation du bâtiment et de ses besoins en chaleur).
              </ArrowItem>
              <ArrowItem color="white">
                Différentes entreprises signataires de la charte « Chauffage des bâtiments résidentiels collectifs et tertiaires » offrent
                cette prime. <br />
                <strong>
                  Le montant de la prime peut significativement varier d’une entreprise à l’autre, il est donc important de comparer les
                  offres proposées.
                </strong>
              </ArrowItem>
            </div>
            <div className="ml-8 mt-1">
              <Link href="/ressources/aides#contenu" variant="primary">
                Tout savoir sur cette aide
              </Link>
            </div>
          </div>
          <div>
            <h4 className="fr-h4 text-white">Estimez le coup de pouce pour votre résidence</h4>
            <Simulator />
          </div>
        </div>
        {citySlug !== 'paris' && cityData.dispositifs && (
          <div className="fr-p-4w">
            <Dispositifs
              city={citySlug}
              dispositifsTitle={cityData.dispositifsTitle}
              dispositifs={cityData.dispositifs as DispositifsData[]}
            />
          </div>
        )}
      </div>
      <div className="bg-[#f9f8f6] p-8">
        <h2 className="text-center text-blue">Les différentes étapes en copropriété :</h2>
        <div className="flex flex-col fr-container">
          {userExperience.map((props) => (
            <div key={`box-user-experience-${props.imgSrc}`} className="flex flex-row items-center space-between relative">
              <WrappedText markdown={false} textClassName="user-experience-description" center {...props} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default City;
