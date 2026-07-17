import { center } from '@turf/center';
import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';

import Image from '@/components/ui/Image';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { ModeDeChauffageEnriched, Situation } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { PrerequisitesList } from '@/modules/chaleur-renouvelable/client/results/ui/PrerequisitesList';
import { ProsConsLists } from '@/modules/chaleur-renouvelable/client/results/ui/ProsConsLists';
import { SolutionConsumptionPanel } from '@/modules/chaleur-renouvelable/client/results/ui/SolutionConsumptionPanel';
import { SolutionCta } from '@/modules/chaleur-renouvelable/client/results/ui/SolutionCta';
import { UsageTags } from '@/modules/chaleur-renouvelable/client/results/ui/UsageTags';
import type { BatEnrBatiment, DPE } from '@/modules/chaleur-renouvelable/constants';
import { Map } from '@/modules/map/client/Map';

const MapMarker = dynamic(() => import('@/modules/map/client/interactions/MapMarker').then((mod) => mod.MapMarker), { ssr: false });

export type HeatNetworkRecommendedSolutionCardProps = {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  geoAddress?: BANAddressFeature;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  isOpen: boolean;
  onOpenChange: (expanded: boolean) => void;
  selectedBatiment?: BatEnrBatiment;
  situation: Situation;
};

export function HeatNetworkRecommendedSolutionCard({
  item,
  dpeFrom,
  geoAddress,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  isOpen,
  onOpenChange,
  selectedBatiment,
  situation,
}: HeatNetworkRecommendedSolutionCardProps) {
  const heatNetwork = situation.eligibiliteReseauChaleur;
  const prerequisiteRows = item.prerequis(situation);
  const mapConfiguration = useMemo(
    () => ({
      filtreIdentifiantReseau: heatNetwork?.id ? [heatNetwork.id] : [],
      reseauxDeChaleur: {
        show: true,
      },
      zonesDeDeveloppementPrioritaire: true,
    }),
    [heatNetwork?.id]
  );
  const mapMarkerCoordinates = useMemo(
    () => getMapMarkerCoordinates(selectedBatiment?.geometry, geoAddress),
    [geoAddress, selectedBatiment?.geometry]
  );

  const networkName = heatNetwork?.name ? ` de ${heatNetwork.name}` : '';
  const distanceLabel = heatNetwork?.distance !== null && heatNetwork?.distance !== undefined ? `${heatNetwork.distance} m` : 'proximité';

  useEffect(() => {
    if (!geoAddress) {
      return;
    }

    trackPostHogEvent('fcr_contact:map_viewed');
  }, [geoAddress]);

  return (
    <section className="fr-mt-6w border border-gray-200 border-l-4 border-l-green-600 bg-white px-6 py-6 md:px-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide">Solution recommandée</p>
          <h3 className="mb-3 text-3xl font-bold text-blue">{item.label}</h3>
          <UsageTags usage={item.usage} />
        </div>
        <Image src={`/${item.icone}`} alt="icone reseau de chaleur" width={192} height={128} className="hidden object-contain md:block" />
      </div>
      <p>
        Votre bâtiment est situé à <strong>{distanceLabel}</strong> du réseau de chaleur{networkName}. C’est la solution à privilégier pour
        un chauffage collectif. Une énergie majoritairement <strong>renouvelable et locale</strong>, un <strong>prix stable</strong> et une{' '}
        <strong>TVA réduite à 5,5 %</strong>, le tout garanti par un service public.
      </p>
      <div className="grid-1 grid gap-6 md:grid-cols-3">
        {mapMarkerCoordinates && (
          <Map
            key={mapMarkerCoordinates.join(',')}
            config={mapConfiguration}
            initialView={{ center: mapMarkerCoordinates, zoom: 15 }}
            legend={false}
            search="none"
          >
            <MapMarker longitude={mapMarkerCoordinates[0]} latitude={mapMarkerCoordinates[1]} />
          </Map>
        )}
        <SolutionConsumptionPanel
          dpeFrom={dpeFrom}
          item={item}
          coutParAnGaz={coutParAnGaz}
          coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
          className="text-xl"
        />
        <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} />
      </div>
      <div className="mt-6 flex flex-col items-start gap-4 md:flex-row md:items-center">
        <SolutionCta item={item} />
        <button
          type="button"
          className="bg-transparent p-0 text-blue underline"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Fermer −' : 'Lire plus +'}
        </button>
      </div>
      {isOpen && (
        <div className="mt-8">
          <PrerequisitesList
            rows={prerequisiteRows}
            coutInstallation={item.coutInstallation}
            solutionType={item.label}
            variant="recommended"
          />
        </div>
      )}
    </section>
  );
}

function getMapMarkerCoordinates(
  geometry: GeoJSON.Geometry | null | undefined,
  geoAddress?: BANAddressFeature
): [number, number] | undefined {
  if (geometry) {
    const centerFeature = center(geometry);
    const longitude = centerFeature.geometry.coordinates[0];
    const latitude = centerFeature.geometry.coordinates[1];

    if (typeof longitude === 'number' && typeof latitude === 'number') {
      return [longitude, latitude];
    }
  }

  return geoAddress?.geometry.coordinates;
}
