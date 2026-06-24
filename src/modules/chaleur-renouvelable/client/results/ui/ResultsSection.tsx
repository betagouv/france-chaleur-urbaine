import { useEffect, useMemo, useState } from 'react';

import { getCostPrecisionRange } from '@/components/ComparateurPublicodes/Graph';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import { trackPostHogEvent } from '@/modules/analytics/client';
import {
  improveDpe,
  type ModeDeChauffageEnriched,
  type ModeDeChauffageUsage,
  type Situation,
} from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { DpeProgression } from '@/modules/chaleur-renouvelable/client/results/ui/DpeProgression';
import { GainVsGazBadge } from '@/modules/chaleur-renouvelable/client/results/ui/GainVsGazBadge';
import { PrerequisitesList } from '@/modules/chaleur-renouvelable/client/results/ui/PrerequisitesList';
import { ProsConsLists } from '@/modules/chaleur-renouvelable/client/results/ui/ProsConsLists';
import { Stars } from '@/modules/chaleur-renouvelable/client/results/ui/Stars';
import type { DPE, TypeLogement } from '@/modules/chaleur-renouvelable/constants';
import cx from '@/utils/cx';

const resultsTabs = [
  { label: 'Chauffage + Eau chaude', value: 'heatingAndHotWater' },
  { label: 'Eau chaude uniquement', value: 'hotWaterOnly' },
] satisfies Array<{ label: string; value: ModeDeChauffageUsage }>;

type ResultsSectionProps = {
  items: ModeDeChauffageEnriched[];
  dpeFrom: DPE;
  openAccordionId: string | null;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  situation: Situation;
  typeLogement: TypeLogement;
  onEditParamsClick: () => void;
  onOpenChange: (id: string, expanded: boolean) => void;
  onCtaClick?: () => void;
};

export function ResultsSection({
  items,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  dpeFrom,
  openAccordionId,
  situation,
  typeLogement,
  onEditParamsClick,
  onOpenChange,
  onCtaClick,
}: ResultsSectionProps) {
  const [activeTab, setActiveTab] = useState<ModeDeChauffageUsage>('heatingAndHotWater');
  const itemsByUsage = useMemo(
    () =>
      resultsTabs.reduce(
        (itemsByTab, tab) => ({
          ...itemsByTab,
          [tab.value]: items.filter((item) => item.usage === tab.value),
        }),
        {} as Record<ModeDeChauffageUsage, ModeDeChauffageEnriched[]>
      ),
    [items]
  );
  const activeItems = itemsByUsage[activeTab];

  useEffect(() => {
    if (activeItems.length > 0 || activeTab === 'hotWaterOnly') {
      return;
    }

    const firstAvailableTab = resultsTabs.find((tab) => itemsByUsage[tab.value].length > 0);
    if (firstAvailableTab) {
      setActiveTab(firstAvailableTab.value);
    }
  }, [activeItems.length, activeTab, itemsByUsage]);

  if (items.length === 0) {
    return null;
  }

  const currentHotWaterModeLabel = situation.modeEauChaudeSanitaire ?? 'Non renseigné';

  return (
    <>
      <h3 className="fr-mt-6w mb-5">Autres solutions possibles</h3>
      <div className="flex flex-wrap items-end">
        {resultsTabs.map((tab) => {
          const count = itemsByUsage[tab.value].length;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              className={cx(
                'border border-b-0 px-5 py-3 font-bold',
                isActive ? 'border-blue border-t-4 bg-white text-blue' : 'border-transparent bg-[#EEEEFF]'
              )}
              onClick={() => {
                trackPostHogEvent('fcr_results:tab_switched', {
                  tab_value: tab.value === 'heatingAndHotWater' ? 'chauffage_ecs' : 'ecs_uniquement',
                });
                if (tab.value === 'hotWaterOnly' && count === 0) {
                  trackPostHogEvent('fcr_results:no_ecs_solution_displayed', { heating_mode: typeLogement });
                }
                setActiveTab(tab.value);
              }}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="border border-gray-200 bg-white py-6 pr-3">
        {activeTab === 'hotWaterOnly' && (
          <div className="px-5">
            <div className="mb-6 border-l-4 border-blue bg-gray-100 px-4 py-3">
              <div className="flex items-start gap-3">
                <span
                  className="fr-icon-information-fill mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-sm text-white"
                  aria-hidden="true"
                />
                <div>
                  <p className="mb-1 font-bold text-blue">Mode actuel : {currentHotWaterModeLabel}</p>
                  <p className="mb-0 text-sm">
                    Si ce n’est pas correct, vous pouvez le{' '}
                    <button type="button" className="font-bold text-blue underline" onClick={onEditParamsClick}>
                      modifier dans les paramètres
                    </button>
                    .
                  </p>
                </div>
              </div>
            </div>
            <p>Voici des solutions qui produisent uniquement de l’eau chaude, en complément d’un système de chauffage existant :</p>
          </div>
        )}
        {activeTab === 'hotWaterOnly' && activeItems.length === 0 && (
          <div className="border-l-4 border-blue bg-gray-100 px-5 py-3 mx-5">
            <p className="mb-2 font-bold text-blue">Aucune solution eau chaude seule n’est adaptée à votre situation.</p>
            <button
              type="button"
              className="text-blue underline"
              onClick={() => {
                trackPostHogEvent('fcr_results:ecs_to_full_tab_clicked');
                setActiveTab('heatingAndHotWater');
              }}
            >
              Voir les solutions chauffage + eau chaude
            </button>
          </div>
        )}
        {activeItems.map((item, index) => {
          const id = item.label;

          return (
            <OtherSolutionRow
              key={id}
              item={item}
              coutParAnGaz={coutParAnGaz}
              coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
              dpeFrom={dpeFrom}
              situation={situation}
              isOpen={openAccordionId === id}
              position={index + 1}
              onOpenChange={(expanded) => onOpenChange(id, expanded)}
              onCtaClick={onCtaClick}
            />
          );
        })}
        <div className="mt-4 flex justify-end text-sm">
          <span className="fr-icon-stack-line mr-2" aria-hidden="true" />
          Vérifié automatiquement à partir de votre adresse et de vos paramètres
        </div>
      </div>
    </>
  );
}

type OtherSolutionRowProps = {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  isOpen: boolean;
  position: number;
  situation: Situation;
  onOpenChange: (expanded: boolean) => void;
  onCtaClick?: () => void;
};

function OtherSolutionRow({
  item,
  dpeFrom,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  isOpen,
  position,
  situation,
  onOpenChange,
  onCtaClick,
}: OtherSolutionRowProps) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const prerequisiteRows = item.prerequis(situation);

  return (
    <Accordion
      simple
      expanded={isOpen}
      onExpandedChange={(expanded) => {
        trackPostHogEvent(expanded ? 'fcr_results:alternative_solution_opened' : 'fcr_results:alternative_solution_closed', {
          position,
          solution_type: item.label,
        });
        onOpenChange(expanded);
      }}
      label={
        <OtherSolutionLabel
          item={item}
          lowerBoundString={lowerBoundString}
          upperBoundString={upperBoundString}
          coutParAnGaz={coutParAnGaz}
          coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
          dpeFrom={dpeFrom}
          dpeTo={dpeTo}
        />
      }
    >
      <div className="grid grid-cols-1 gap-5 px-5 md:grid-cols-5">
        <div className="md:col-span-2">
          <h4 className="text-lg uppercase">Description</h4>
          <p className="mb-0">{item.description}</p>
        </div>
        <div className="md:col-span-2">
          <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} />
        </div>
        <div className="flex justify-center">
          <Image src={`/${item.icone}`} alt="" width={216} height={162} className="justify-self-center object-contain" />
        </div>
      </div>
      <div className="mt-6 px-5">
        <PrerequisitesList rows={prerequisiteRows} coutInstallation={item.coutInstallation} solutionType={item.label} variant="compact" />
        <Button
          href="#help-ademe"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          className="my-3"
          postHogEventKey="fcr_results:alternative_solution_cta_clicked"
          postHogEventProps={{ solution_type: item.label }}
          onClick={onCtaClick}
        >
          Passer à l’étape suivante
        </Button>
      </div>
    </Accordion>
  );
}

type OtherSolutionLabelProps = {
  item: ModeDeChauffageEnriched;
  lowerBoundString: string;
  upperBoundString: string;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  dpeFrom: DPE;
  dpeTo: DPE;
};

function OtherSolutionLabel({
  item,
  lowerBoundString,
  upperBoundString,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  dpeFrom,
  dpeTo,
}: OtherSolutionLabelProps) {
  return (
    <span className="grid w-full gap-5 p-5 text-left md:grid-cols-[2fr_1fr_auto_auto] md:items-center">
      <span>
        <span className="mb-3 block text-blue text-lg">{item.label}</span>
        <Stars value={item.pertinence} />
      </span>
      <span className="text-center">
        <span className="text-blue text-lg">
          {lowerBoundString} à {upperBoundString}
        </span>
        <br />
        <span className="text-(--text-default-grey)">par an par logement</span>
      </span>
      <GainVsGazBadge item={item} coutParAnGaz={coutParAnGaz} coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly} />
      <DpeProgression from={dpeFrom} to={dpeTo} />
    </span>
  );
}
