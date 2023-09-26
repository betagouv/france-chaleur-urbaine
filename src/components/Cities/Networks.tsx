import WrappedText from '@components/WrappedText/WrappedText';
import Link from 'next/link';
import Map from '@components/Map/Map';
import ClassedNetwork from '@components/Network/ClassedNetwork';
import EnergiesChart from '@components/Network/EnergiesChart';
import { Network } from 'src/types/Summary/Network';
import { NetworkContainer, NetworkColumn } from './Networks.styles';
import Slice from '@components/Slice';

type NetworskData = {
  isClassed: boolean;
  identifiant?: string;
  heatedPlaces?: string;
  gestionnaires?: string;
};

const Networks = ({
  networksData,
  network,
  cityCoord,
}: {
  networksData: NetworskData;
  network?: Network;
  cityCoord: [number, number];
}) => {
  return (
    <NetworkContainer>
      <NetworkColumn className="fr-col-md-6 fr-col-12">
        {networksData.gestionnaires && (
          <WrappedText body={`::arrow-item[${networksData.gestionnaires}]`} />
        )}
        {networksData.isClassed && (
          <>
            {!network && (
              <WrappedText
                body={`::arrow-item[Certains de ces réseaux sont classés]`}
              />
            )}
            <div className="fr-pb-4w">
              <ClassedNetwork />
            </div>
          </>
        )}
        {!network && (
          <WrappedText
            body={`::arrow-item[Pour savoir de quel réseau votre bâtiment dépend, **veuillez tester votre adresse**]`}
          />
        )}
        {networksData.heatedPlaces && (
          <WrappedText
            body={`::arrow-item[Plus de **${networksData.heatedPlaces} logements** chauffés]`}
          />
        )}
        {network && (
          <>
            {network.longueur_reseau > 0 && (
              <WrappedText
                body={`::arrow-item[**${network.longueur_reseau} km** de canalisations souterraines]`}
              />
            )}
            {network['Taux EnR&R'] !== null &&
              network['Taux EnR&R'] !== undefined && (
                <WrappedText
                  body={`::arrow-item[Le taux **d'énergies renouvelables et de récupération** du réseau est de **${network['Taux EnR&R']} %**]`}
                />
              )}
            {network.Gestionnaire && (
              <WrappedText
                body={`::arrow-item[Le réseau est géré par **${network.Gestionnaire}**.]`}
              />
            )}
            <Slice padding={4}>
              <EnergiesChart network={network} height="250px" />
              <div className="fr-btn fr-mt-4w fr-m-auto">
                <Link href={`/reseaux/${network['Identifiant reseau']}`}>
                  Voir la fiche technique du réseau
                </Link>
              </div>
            </Slice>
          </>
        )}
      </NetworkColumn>
      <NetworkColumn className="fr-col-md-6 fr-col-12">
        <Map
          noPopup
          withCenterPin
          center={cityCoord}
          initialZoom={11}
          initialLayerDisplay={{
            outline: true,
            futurOutline: false,
            coldOutline: false,
            zoneDP: false,
            demands: false,
            raccordements: false,
            gasUsageGroup: false,
            buildings: false,
            gasUsage: [],
            energy: [],
            gasUsageValues: [1000, Number.MAX_VALUE],
            energyGasValues: [50, Number.MAX_VALUE],
            energyFuelValues: [50, Number.MAX_VALUE],
          }}
        />
      </NetworkColumn>
    </NetworkContainer>
  );
};

export default Networks;
