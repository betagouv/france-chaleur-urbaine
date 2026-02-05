import dynamic from 'next/dynamic';
import Link from 'next/link';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import { ArrowItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import ClassedNetwork from '@/components/Network/ClassedNetwork';
import EnergiesChart from '@/components/Network/EnergiesChart';
import Slice from '@/components/Slice';
import type { Network } from '@/types/Summary/Network';

import { NetworkContainer } from './Networks.styles';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

type NetworksData = {
  isClassed: boolean;
  identifiant?: string;
  heatedPlaces?: string;
  gestionnaires?: string;
};

const Networks = ({ networksData, network, cityCoord }: { networksData: NetworksData; network?: Network; cityCoord: [number, number] }) => {
  return (
    <NetworkContainer>
      <div className="fr-col-md-6 fr-col-12">
        {networksData.gestionnaires && <ArrowItem>{networksData.gestionnaires}</ArrowItem>}
        {networksData.isClassed && (
          <>
            {!network && <ArrowItem>Certains de ces réseaux sont classés</ArrowItem>}
            <div className="fr-pb-4w">
              <ClassedNetwork />
            </div>
          </>
        )}
        {!network && (
          <ArrowItem>
            Pour savoir de quel réseau votre bâtiment dépend, <strong>veuillez tester votre adresse</strong>
          </ArrowItem>
        )}
        {networksData.heatedPlaces && (
          <ArrowItem>
            Plus de <strong>{networksData.heatedPlaces} logements</strong> chauffés
          </ArrowItem>
        )}
        {network && (
          <>
            {network.longueur_reseau > 0 && (
              <ArrowItem>
                <strong>{network.longueur_reseau} km</strong> de canalisations souterraines
              </ArrowItem>
            )}
            {network['Taux EnR&R'] !== null && network['Taux EnR&R'] !== undefined && (
              <ArrowItem>
                Le taux <strong>d'énergies renouvelables et de récupération</strong> du réseau est de{' '}
                <strong>{network['Taux EnR&R']} %</strong>
              </ArrowItem>
            )}
            {network.Gestionnaire && (
              <ArrowItem>
                Le réseau est géré par <strong>{network.Gestionnaire}</strong>.
              </ArrowItem>
            )}
            <Slice padding={4}>
              <EnergiesChart network={network} height="250px" />
              <div className="fr-btn fr-mt-4w fr-m-auto">
                <Link href={`/reseaux/${network['Identifiant reseau']}`}>Voir la fiche technique du réseau</Link>
              </div>
            </Slice>
          </>
        )}
      </div>
      <div className="fr-col-md-6 fr-col-12">
        <Map
          noPopup
          withCenterPin
          initialCenter={cityCoord}
          initialZoom={11}
          initialMapConfiguration={createMapConfiguration({
            filtreIdentifiantReseau: networksData.identifiant ? [networksData.identifiant] : [],
            reseauxDeChaleur: {
              show: true,
            },
          })}
        />
      </div>
    </NetworkContainer>
  );
};

export default Networks;
