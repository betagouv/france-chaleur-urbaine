import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import Image from '@/components/ui/Image';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { ModeDeChauffageEnriched, Situation } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import {
  PrerequisitesList,
  ProsConsLists,
  SolutionConsumptionPanel,
  SolutionCta,
  UsageTags,
} from '@/modules/chaleur-renouvelable/client/results/SolutionCommon';
import type { DPE } from '@/modules/chaleur-renouvelable/constants';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

export type RecommendedSolutionCardProps = {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  geoAddress?: BANAddressFeature;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  isOpen: boolean;
  onHelpButtonClick?: () => void;
  onOpenChange: (expanded: boolean) => void;
  situation: Situation;
};

export function RecommendedSolutionCard({
  item,
  dpeFrom,
  geoAddress,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  isOpen,
  onHelpButtonClick,
  onOpenChange,
  situation,
}: RecommendedSolutionCardProps) {
  if (item.label === 'Réseau de chaleur' && situation.eligibiliteReseauChaleur) {
    return (
      <HeatNetworkRecommendedSolutionCard
        item={item}
        dpeFrom={dpeFrom}
        geoAddress={geoAddress}
        coutParAnGaz={coutParAnGaz}
        coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
        isOpen={isOpen}
        onHelpButtonClick={onHelpButtonClick}
        onOpenChange={onOpenChange}
        situation={situation}
      />
    );
  }

  const prerequisiteRows = item.prerequis(situation);

  return (
    <section className="fr-mt-6w border border-gray-200 border-l-4 border-l-green-600 bg-white px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-2 text-lg font-semibold uppercase">Solution recommandée</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="mb-3 text-3xl font-bold text-blue">{item.label}</h3>
              <UsageTags usage={item.usage} />
            </div>
          </div>
        </div>
        <div>
          <Image src={`/${item.icone}`} alt="" width={120} height={72} className="object-contain" />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <h4 className="text-lg font-bold uppercase text-grey">Description</h4>
          <p>{item.description}</p>
        </div>
        <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} />
        <SolutionConsumptionPanel
          dpeFrom={dpeFrom}
          item={item}
          coutParAnGaz={coutParAnGaz}
          coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
        />
      </div>
      <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-center">
        <SolutionCta item={item} onHelpButtonClick={onHelpButtonClick} />
        <button
          type="button"
          className="bg-transparent p-0 text-blue underline"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Afficher moins −' : 'Afficher plus +'}
        </button>
      </div>
      {isOpen && (
        <div className="mt-10">
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

function HeatNetworkRecommendedSolutionCard({
  item,
  dpeFrom,
  geoAddress,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  isOpen,
  onHelpButtonClick,
  onOpenChange,
  situation,
}: RecommendedSolutionCardProps) {
  const heatNetwork = situation.eligibiliteReseauChaleur;
  const prerequisiteRows = item.prerequis(situation);
  const mapConfiguration = useMemo(
    () =>
      createMapConfiguration({
        filtreIdentifiantReseau: heatNetwork?.id ? [heatNetwork.id] : [],
        reseauxDeChaleur: {
          show: true,
        },
      }),
    [heatNetwork?.id]
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
        <Image src={`/${item.icone}`} alt="" width={136} height={104} className="hidden object-contain md:block" />
      </div>
      <p>
        Votre bâtiment est situé à <strong>{distanceLabel}</strong> du réseau de chaleur{networkName}. C’est la solution à privilégier pour
        un chauffage collectif. Une énergie majoritairement <strong>renouvelable et locale</strong>, un <strong>prix stable</strong> et une{' '}
        <strong>TVA réduite à 5,5 %</strong>, le tout garanti par un service public.
      </p>
      <div className="grid-1 grid gap-6 md:grid-cols-3">
        {geoAddress && (
          <div className="h-full overflow-hidden border border-solid border-border-default-grey">
            <Map
              withCenterPin
              initialCenter={geoAddress.geometry.coordinates}
              initialZoom={15}
              initialMapConfiguration={mapConfiguration}
            />
          </div>
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
        <SolutionCta item={item} onHelpButtonClick={onHelpButtonClick} />
        <button
          type="button"
          className="bg-transparent p-0 text-blue underline"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Lire moins −' : 'Lire plus +'}
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
