import dynamic from 'next/dynamic';
import Link from 'next/link';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import ClassedNetwork from '@/components/Network/ClassedNetwork';
import EnergiesChart from '@/components/Network/EnergiesChart';
import Slice from '@/components/Slice';
import WrappedText from '@/components/WrappedText/WrappedText';
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
        {networksData.gestionnaires && <WrappedText body={`::arrow-item[${networksData.gestionnaires}]`} />}
        {networksData.isClassed && (
          <>
            {!network && <WrappedText body={`::arrow-item[Certains de ces réseaux sont classés]`} />}
            <div className="fr-pb-4w">
              <ClassedNetwork />
            </div>
          </>
        )}
        {!network && (
          <WrappedText body={`::arrow-item[Pour savoir de quel réseau votre bâtiment dépend, **veuillez tester votre adresse**]`} />
        )}
        {networksData.heatedPlaces && <WrappedText body={`::arrow-item[Plus de **${networksData.heatedPlaces} logements** chauffés]`} />}
        {network && (
          <>
            {network.longueur_reseau > 0 && (
              <WrappedText body={`::arrow-item[**${network.longueur_reseau} km** de canalisations souterraines]`} />
            )}
            {network['Taux EnR&R'] !== null && network['Taux EnR&R'] !== undefined && (
              <WrappedText
                body={`::arrow-item[Le taux **d'énergies renouvelables et de récupération** du réseau est de **${network['Taux EnR&R']} %**]`}
              />
            )}
            {network.Gestionnaire && <WrappedText body={`::arrow-item[Le réseau est géré par **${network.Gestionnaire}**.]`} />}
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
