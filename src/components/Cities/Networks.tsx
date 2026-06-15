import { ArrowItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import ClassedNetwork from '@/components/Network/ClassedNetwork';
import EnergiesChart from '@/components/Network/EnergiesChart';
import Slice from '@/components/Slice';
import Link from '@/components/ui/Link';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { MapMarker } from '@/modules/map/client/interactions/MapMarker';
import { Map } from '@/modules/map/client/Map';
import type { Network } from '@/types/Summary/Network';

import { NetworkContainer } from './Networks.styles';

type NetworksData = {
  isClassed: boolean;
  identifiant?: string;
  heatedPlaces?: string;
  gestionnaires?: React.ReactNode;
};

type NetworksProps = {
  citySlug: string;
  networksData: NetworksData;
  network?: Network;
  cityCoord: [number, number];
};

const Networks = ({ citySlug, networksData, network, cityCoord }: NetworksProps) => {
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
                <Link
                  postHogEventKey="city_page:network_link_clicked"
                  postHogEventProps={{ city_slug: citySlug, target: 'reseau_detail' }}
                  href={`/reseaux/${network['Identifiant reseau']}`}
                >
                  Voir la fiche technique du réseau
                </Link>
              </div>
            </Slice>
          </>
        )}
      </div>
      <div className="fr-col-md-6 fr-col-12">
        <div className="h-[500px]">
          <Map
            initialView={{ center: cityCoord, zoom: 11 }}
            config={createMapConfiguration({
              filtreIdentifiantReseau: networksData.identifiant ? [networksData.identifiant] : [],
              reseauxDeChaleur: {
                show: true,
              },
            })}
          >
            <MapMarker longitude={cityCoord[0]} latitude={cityCoord[1]} color="#4550e5" />
          </Map>
        </div>
      </div>
    </NetworkContainer>
  );
};

export default Networks;
