import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getCostPrecisionRange } from '@/components/ComparateurPublicodes/Graph';
import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import { EligibilityFormContact } from '@/components/EligibilityForm';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import useIsMobile from '@/hooks/useIsMobile';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { BatEnrBatimentSelection } from '@/modules/chaleur-renouvelable/client/BatEnrBatimentSelection';
import DemandeFCRForm from '@/modules/chaleur-renouvelable/client/DemandFCRForm';
import FranceRenovHelp from '@/modules/chaleur-renouvelable/client/FranceRenovHelp';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/hooks/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { useRemoveHashOnScroll } from '@/modules/chaleur-renouvelable/client/hooks/useRemoveHashOnScroll';
import {
  DPE_BG,
  getIncompatibleSolutionRows,
  type IncompatibleSolutionRow,
  improveDpe,
  type ModeDeChauffage,
  type ModeDeChauffageEnriched,
  type ModeDeChauffageUsage,
  modeDeChauffageParTypeLogement,
  type PrerequisiteRow,
  type PrerequisiteStatus,
  type Situation,
} from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import type { DPE, ModeEauChaudeSanitaire } from '@/modules/chaleur-renouvelable/constants';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';
import type { BoundingBox } from '@/modules/geo/types';
import type { Point } from '@/types/Point';
import cx from '@/utils/cx';

import { HOT_WATER_PARAMS_SECTION_ID, ParamsForm } from './ParamsForm';

type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

const usageTagConfig = {
  heating: {
    icon: '/img/icon-chauffage.svg',
    label: 'Chauffage',
  },
  hotWater: {
    icon: '/img/icon-eau-chaude.svg',
    label: 'Eau chaude',
  },
} satisfies Record<string, { icon: string; label: string }>;

const resultsTabs = [
  { label: 'Chauffage + Eau chaude', value: 'heatingAndHotWater' },
  { label: 'Eau chaude uniquement', value: 'hotWaterOnly' },
] satisfies Array<{ label: string; value: ModeDeChauffageUsage }>;

const heatNetworkContactModal = createModal({
  id: 'heat-network-contact-modal',
  isOpenedByDefault: false,
});

const batEnrBatimentSelectionModal = createModal({
  id: 'bat-enr-batiment-selection-modal',
  isOpenedByDefault: false,
});

function getBoundsAroundPoint([longitude, latitude]: Point, radiusMeters: number): BoundingBox {
  const metersPerDegreeLatitude = 111_320;
  const latitudeDelta = radiusMeters / metersPerDegreeLatitude;
  const longitudeDelta = radiusMeters / (metersPerDegreeLatitude * Math.max(Math.cos((latitude * Math.PI) / 180), 0.1));

  return [longitude - longitudeDelta, latitude - latitudeDelta, longitude + longitudeDelta, latitude + latitudeDelta];
}

function enrichHeatingMode(mode: ModeDeChauffage, engine: SimulatorEngine, situation: Situation): ModeDeChauffageEnriched {
  const coutParAn = mode.coutParAnPublicodeKey
    ? engine.getFieldAsNumber(`Bilan x ${mode.coutParAnPublicodeKey} . total sans installation` as RuleName)
    : 0;
  const coutInstallation =
    typeof mode.coutInstallation === 'function' ? mode.coutInstallation(situation) : String(mode.coutInstallation ?? '0');
  const contraintesTechniques =
    typeof mode.contraintesTechniques === 'function' ? mode.contraintesTechniques(situation) : mode.contraintesTechniques;

  return { ...mode, contraintesTechniques, coutInstallation, coutParAn };
}

const getModeEauChaudeSanitaireFromBatEnr = (typeInstallationEcs: string | null): ModeEauChaudeSanitaire | null => {
  const normalizedTypeInstallationEcs = typeInstallationEcs?.trim().toLowerCase();

  if (normalizedTypeInstallationEcs === 'individuel') {
    return 'Individuel';
  }

  return normalizedTypeInstallationEcs === 'collectif' ? 'Collectif' : null;
};

export default function ChoixChauffageResults() {
  const engine = useSimulatorEngine();
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const isMobile = useIsMobile();
  const urlParams = useChoixChauffageQueryParams();
  useRemoveHashOnScroll('#help-ademe');
  const {
    geoAddress,
    setGeoAddress,
    batEnr,
    batEnrBatiments,
    codeDepartement,
    eligibiliteReseauChaleur,
    shouldSelectBatEnrBatiment,
    temperatureRef,
    onSelectGeoAddress,
    resetEligibility,
    selectBatEnrBatiment,
    selectedBatEnrBatiment,
  } = useAddressEligibility(urlParams.adresse ?? null, urlParams.constructionId);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const lastPrefilledBatimentConstructionIdRef = useRef<string | null>(null);
  const {
    addressData,
    contactReady,
    messageReceived,
    loadingStatus,
    handleOnSubmitContact,
    handleOnSuccessAddress,
    handleResetFormContact,
  } = useContactFormFCU();

  const situation: Situation = useMemo(
    () => ({
      adresse: urlParams.adresse ?? null,
      architecturalProtectionAc1: batEnr.architecturalProtectionAc1,
      architecturalProtectionAc2: batEnr.architecturalProtectionAc2,
      architecturalProtectionAc3: batEnr.architecturalProtectionAc3,
      architecturalProtectionAc4: batEnr.architecturalProtectionAc4,
      architecturalProtectionAc4bis: batEnr.architecturalProtectionAc4bis,
      dpe: urlParams.dpe,
      eligibiliteReseauChaleur,
      espaceExterieur: urlParams.espaceExterieur ?? 'none',
      geothermalNappeGmi: batEnr.geothermalNappeGmi,
      geothermalNappePotential: batEnr.geothermalNappePotential,
      geothermalSondeGmi: batEnr.geothermalSondeGmi,
      geothermiePossible: batEnr.geothermiePossible,
      habitantsMoyen: Number.parseFloat(urlParams.habitantsMoyen || '2'),
      hasGeothermalProbeSpace: batEnr.hasGeothermalProbeSpace,
      nbLogements: urlParams.nbLogements ?? 25,
      planProtectionAtmosphere: batEnr.planProtectionAtmosphere,
      surfaceMoyenne: urlParams.surfaceMoyenne ?? 70,
      typeRadiateur: urlParams.typeRadiateur,
    }),
    [
      urlParams.adresse,
      batEnr.architecturalProtectionAc1,
      batEnr.architecturalProtectionAc2,
      batEnr.architecturalProtectionAc3,
      batEnr.architecturalProtectionAc4,
      batEnr.architecturalProtectionAc4bis,
      urlParams.dpe,
      urlParams.espaceExterieur,
      urlParams.habitantsMoyen,
      urlParams.nbLogements,
      urlParams.surfaceMoyenne,
      urlParams.typeRadiateur,
      batEnr.geothermiePossible,
      batEnr.geothermalNappeGmi,
      batEnr.geothermalNappePotential,
      batEnr.geothermalSondeGmi,
      batEnr.hasGeothermalProbeSpace,
      batEnr.planProtectionAtmosphere,
      eligibiliteReseauChaleur,
    ]
  );

  // Pousse la situation dans Publicodes dès qu’elle change
  useEffect(() => {
    if (!codeDepartement) return;

    const modeEauChaudeSanitaire = urlParams.modeEauChaudeSanitaire;
    const currentEngine = engineRef.current;

    currentEngine.setSituation({
      'code département': `'${codeDepartement}'`,
      DPE: `'${situation.dpe}'`,
      'Inclure la climatisation': 'non',
      "Nombre d'habitants moyen par appartement": `${situation.habitantsMoyen}`,
      "nombre de logements dans l'immeuble concerné": situation.nbLogements,
      'Production eau chaude sanitaire': modeEauChaudeSanitaire ? 'oui' : 'non',
      'surface logement type tertiaire': `${situation.surfaceMoyenne}`,
      'température de référence chaud commune': temperatureRef,
    });

    currentEngine.resetField('type de production ECS');
  }, [codeDepartement, situation, temperatureRef, urlParams.modeEauChaudeSanitaire]);

  const effectiveTypeLogement = urlParams.typeLogement ?? 'immeuble_chauffage_collectif';

  const modesDeChauffage = useMemo(() => {
    return modeDeChauffageParTypeLogement[effectiveTypeLogement].filter((m) => m.estPossible(situation));
  }, [effectiveTypeLogement, situation]);
  const incompatibleSolutionRows = useMemo(
    () => getIncompatibleSolutionRows(situation, effectiveTypeLogement),
    [effectiveTypeLogement, situation]
  );

  const modesEnriched = useMemo(
    () => modesDeChauffage.map((modeDeChauffage) => enrichHeatingMode(modeDeChauffage, engine, situation)),
    [engine, modesDeChauffage, situation]
  );
  const coutParAnGaz = engine.getFieldAsNumber(`Bilan x Gaz coll sans cond . total avec aides` as RuleName);
  const [recommended, ...others] = modesEnriched;

  const handleAccordionOpenChange = useCallback((id: string, expanded: boolean) => {
    setOpenAccordionId(expanded ? id : null);
    trackPostHogEvent('chaleur-renouvelable:accordeon', { name: id });
  }, []);
  const handleEditHotWaterParamsClick = useCallback(() => {
    setIsParamsOpen(true);
    document.getElementById(HOT_WATER_PARAMS_SECTION_ID)?.scrollIntoView({ block: 'start' });
  }, []);
  const openHeatNetworkContactModal = useCallback(() => {
    if (!geoAddress || !urlParams.adresse || !eligibiliteReseauChaleur) {
      return;
    }

    const [lon, lat] = geoAddress.geometry.coordinates;
    handleOnSuccessAddress(
      {
        address: urlParams.adresse,
        coords: { lat, lon },
        eligibility: eligibiliteReseauChaleur,
        geoAddress,
        heatingType: 'collectif',
      },
      'chaleur-renouvelable'
    );
  }, [eligibiliteReseauChaleur, geoAddress, handleOnSuccessAddress, urlParams.adresse]);
  const handleSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      void urlParams.setConstructionId(null);

      if (!geoAddress) {
        resetEligibility();
        return;
      }
      onSelectGeoAddress(geoAddress);
    },
    [onSelectGeoAddress, resetEligibility, urlParams]
  );
  const handleSelectBatEnrBatiment = useCallback(
    (batEnrBatiment: (typeof batEnrBatiments)[number]) => {
      if (!batEnrBatiment.batiment_construction_id) {
        return;
      }

      void urlParams.setConstructionId(batEnrBatiment.batiment_construction_id);
      selectBatEnrBatiment(batEnrBatiment);
    },
    [selectBatEnrBatiment, urlParams]
  );

  useEffect(() => {
    const batimentConstructionId = selectedBatEnrBatiment?.batiment_construction_id;

    if (!batimentConstructionId || lastPrefilledBatimentConstructionIdRef.current === batimentConstructionId) {
      return;
    }

    lastPrefilledBatimentConstructionIdRef.current = batimentConstructionId;
    const searchParams = new URLSearchParams(window.location.search);

    if (selectedBatEnrBatiment.classe_bilan_dpe && !searchParams.has('dpe')) {
      void urlParams.setDpe(selectedBatEnrBatiment.classe_bilan_dpe);
    }

    const modeEauChaudeSanitaire = getModeEauChaudeSanitaireFromBatEnr(selectedBatEnrBatiment.type_installation_ecs);

    if (modeEauChaudeSanitaire && !searchParams.has('modeEauChaudeSanitaire')) {
      void urlParams.setModeEauChaudeSanitaire(modeEauChaudeSanitaire);
    }

    if (selectedBatEnrBatiment.ffo_bat_nb_log != null && selectedBatEnrBatiment.ffo_bat_nb_log > 0 && !searchParams.has('nbLogements')) {
      void urlParams.setNbLogements(selectedBatEnrBatiment.ffo_bat_nb_log);
    }

    if (
      selectedBatEnrBatiment.dpe_representatif_logement_surface_habitable_immeuble != null &&
      selectedBatEnrBatiment.ffo_bat_nb_log != null &&
      selectedBatEnrBatiment.ffo_bat_nb_log > 0 &&
      !searchParams.has('surfaceMoyenne')
    ) {
      void urlParams.setSurfaceMoyenne(
        Math.round(selectedBatEnrBatiment.dpe_representatif_logement_surface_habitable_immeuble / selectedBatEnrBatiment.ffo_bat_nb_log)
      );
    }
  }, [selectedBatEnrBatiment, urlParams]);

  // pendant l’hydration, on évite de rendre conditionnellement (isMobile null)
  if (isMobile === null) return null;

  return (
    <>
      <ParamsForm
        batiments={batEnrBatiments}
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        values={urlParams.simulationParams}
        onSave={urlParams.setSimulationParams}
        geoAddress={geoAddress}
        selectedBatiment={selectedBatEnrBatiment}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onSelectBatiment={handleSelectBatEnrBatiment}
        onAddressError={() => {}}
      />
      <Modal modal={batEnrBatimentSelectionModal} title="" open={shouldSelectBatEnrBatiment} size="custom" lazy isClosableByUser={false}>
        <BatEnrBatimentSelection
          batiments={batEnrBatiments}
          initialCenter={geoAddress?.geometry.coordinates}
          onSelect={handleSelectBatEnrBatiment}
        />
      </Modal>
      {modesEnriched.length > 0 ? (
        <>
          <RecommendedSolutionCard
            item={recommended}
            coutParAnGaz={coutParAnGaz}
            dpeFrom={urlParams.dpe}
            geoAddress={geoAddress}
            isOpen={openAccordionId === recommended.label}
            onHelpButtonClick={recommended?.helpAction === 'open-heat-network-contact' ? openHeatNetworkContactModal : undefined}
            onOpenChange={(expanded) => handleAccordionOpenChange(recommended.label, expanded)}
            situation={situation}
          />
          <ResultsSection
            title="Autres solutions possibles"
            items={others}
            coutParAnGaz={coutParAnGaz}
            dpeFrom={urlParams.dpe}
            openAccordionId={openAccordionId}
            situation={situation}
            onEditParamsClick={handleEditHotWaterParamsClick}
            onOpenChange={handleAccordionOpenChange}
          />
          <IncompatibleSolutionsSection rows={incompatibleSolutionRows} />
          <DemandeFCRForm />
          <CallOut
            title={
              <>
                <span className="fr-icon-lightbulb-line fr-mr-1w" />
                Comment sont calculés ces résultats ?
              </>
            }
            size="lg"
            colorVariant="blue-ecume"
            className="mt-6"
          >
            Nos recommandations sont calculées à partir des informations que vous avez fournies : mode de chauffage, surface moyenne, classe
            DPE, disponibilité d’espaces extérieurs… Ces critères permettent de classer les solutions par pertinence et d’estimer les coûts
            et contraintes techniques propres à votre situation.
            <div className="fr-mt-3w">
              <Link
                postHogEventKey="link:click"
                postHogEventProps={{ link_name: 'cta_comment_calculer_resultat', source: 'chaleur_renouvelable' }}
                href="/chaleur-renouvelable/methodologie"
              >
                En savoir plus
              </Link>
            </div>
          </CallOut>
          <Modal
            modal={heatNetworkContactModal}
            title=""
            open={contactReady}
            size="custom"
            loading={loadingStatus === 'loading'}
            onClose={handleResetFormContact}
          >
            <div>
              {contactReady && !messageReceived && (
                <EligibilityFormContact
                  addressData={addressData}
                  className="p-0"
                  onSubmit={(data) => handleOnSubmitContact(data, 'choix-chauffage')}
                />
              )}
              {messageReceived && addressData.submissionResult && <DemandSubmittedPanel submissionResult={addressData.submissionResult} />}
            </div>
          </Modal>
        </>
      ) : (
        <NoResultSection codeInsee={geoAddress?.properties.citycode} />
      )}
    </>
  );
}

export function DpeTag({ letter, isSelected = false, onClick }: { letter: DPE; isSelected?: boolean; onClick?: (letter: DPE) => void }) {
  const className = cx(
    'flex h-12 w-12 items-center justify-center rounded-sm border-2',
    DPE_BG[letter],
    onClick && 'cursor-pointer',
    isSelected ? 'border-blue ring-2 ring-blue' : 'border-white'
  );
  const content = (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
      <span className="font-bold">{letter}</span>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className={className} aria-label={`Classe énergétique ${letter}`} onClick={() => onClick(letter)}>
        {content}
      </button>
    );
  }

  return (
    <div className={className} aria-label={`Classe énergétique ${letter}`}>
      {content}
    </div>
  );
}

function getGainPercentVsGaz(item: ModeDeChauffageEnriched, coutParAnGaz: number) {
  if (item.gainVsGaz !== undefined) {
    return item.gainVsGaz;
  }

  return coutParAnGaz > 0 ? Math.round(((item.coutParAn - coutParAnGaz) / coutParAnGaz) * 100) : 0;
}

function getPrerequisiteRows(item: ModeDeChauffageEnriched, situation: Situation): PrerequisiteRow[] {
  return item.prerequis(situation);
}

function PrerequisiteStatusBadge({ status }: { status: PrerequisiteStatus }) {
  const config = {
    aVerifier: {
      className: 'bg-[#FEECC2] text-[#716043]',
      label: 'À VÉRIFIER',
    },
    contraignant: {
      className: 'bg-[#FFE9E6] text-error',
      label: 'CONTRAIGNANT',
    },
    defavorable: {
      className: 'bg-[#FFE9E6] text-error',
      label: 'DÉFAVORABLE',
    },
    favorable: {
      className: 'bg-[#B8FEC9] text-success',
      label: 'FAVORABLE',
    },
  } satisfies Record<PrerequisiteStatus, { className: string; label: string }>;

  return <span className={cx('rounded-sm px-2 py-1 text-sm font-bold', config[status].className)}>{config[status].label}</span>;
}

function IncompatibleSolutionsSection({ rows }: { rows: IncompatibleSolutionRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="fr-mt-6w mb-5">Solutions non compatibles</h3>
      <div className="border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <ul className="m-0 space-y-3 p-0">
          {rows.map((row) => (
            <li key={`${row.label}-${row.reason}`} className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-4">
              <div className="flex items-center gap-3">
                <PrerequisiteStatusBadge status="defavorable" />
                <strong className="whitespace-nowrap text-error">{row.label}</strong>
                <span>{row.reason}</span>
              </div>
              <span className="justify-self-start whitespace-nowrap text-blue md:justify-self-end">
                <span className="fr-icon-stack-line font-bold" aria-hidden="true" /> {row.source}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end text-sm">
          <span className="fr-icon-stack-line mr-2" aria-hidden="true" />
          Vérifié automatiquement à partir de votre adresse et de vos paramètres
        </div>
      </div>
    </section>
  );
}

function UsageTags({ usage }: { usage: ModeDeChauffageUsage }) {
  const tags = usage === 'heatingAndHotWater' ? [usageTagConfig.heating, usageTagConfig.hotWater] : [usageTagConfig.hotWater];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag.label} className="inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm">
          <Image src={tag.icon} alt={`icone ${usage}`} width={20} height={20} aria-hidden="true" />
          {tag.label}
        </span>
      ))}
    </div>
  );
}

function DpeProgression({ from, to }: { from: DPE; to: DPE }) {
  return (
    <div className="flex items-center gap-3">
      <DpeTag letter={from} />
      <span>→</span>
      <DpeTag letter={to} />
    </div>
  );
}

function ProsConsLists({ avantages, inconvenients, layout }: { avantages: string[]; inconvenients: string[]; layout?: string }) {
  return layout === 'column' ? (
    <>
      <div>
        <h4 className="text-lg font-bold uppercase text-success">Avantages</h4>
        <ul className="space-y-1 p-0">
          {avantages.map((avantage) => (
            <li key={avantage} className="flex gap-3">
              <span className="fr-icon-check-line text-success" aria-hidden="true" />
              <span>{avantage}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-bold uppercase text-error">Inconvénients</h4>
        <ul className="space-y-1 p-0">
          {inconvenients.map((inconvenient) => (
            <li key={inconvenient} className="flex gap-3">
              <span className="fr-icon-close-line text-error" aria-hidden="true" />
              <span>{inconvenient}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  ) : (
    <div>
      <h4 className="text-lg font-bold uppercase">
        <span className="text-success">Avantages</span>
        <span className="inline-block font-normal mx-3">/</span>
        <span className="text-error">Inconvénients</span>
      </h4>
      <ul className="m-0 list-none space-y-1 p-0">
        {avantages.map((avantage) => (
          <li key={avantage} className="flex gap-3">
            <span className="fr-icon-check-line text-success" aria-hidden="true" />
            <span>{avantage}</span>
          </li>
        ))}
      </ul>
      <span className="text-error">Inconvénients</span>
      <ul className="m-0 list-none space-y-1 p-0">
        {inconvenients.map((inconvenient) => (
          <li key={inconvenient} className="flex gap-3">
            <span className="fr-icon-close-line text-error" aria-hidden="true" />
            <span>{inconvenient}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrerequisitesLegend({ className }: { className?: string }) {
  return (
    <p className={cx('text-sm', className)}>
      <strong>STATUT :</strong> <strong className="text-success">FAVORABLE</strong> : vérifié, aucun obstacle{' '}
      <strong className="text-error">CONTRAIGNANT</strong> : vérifié, contraintes supplémentaires{' '}
      <strong className="text-[#716043]">À VÉRIFIER</strong> : à vérifier par vous
    </p>
  );
}

function PrerequisiteRowItem({ row }: { row: PrerequisiteRow }) {
  return (
    <li
      className={cx(
        'flex flex-col gap-3 px-3 py-2 md:flex-row md:items-center md:justify-between',
        row.status === 'favorable' ? 'bg-gray-100' : 'bg-[#FFF8E5]'
      )}
    >
      <span className="flex gap-3 items-center">
        <PrerequisiteStatusBadge status={row.status} />
        <span>{row.label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3 self-end md:self-auto">
        {row.source && (
          <span className="text-blue">
            <span className="fr-icon-stack-line font-bold mr-1" aria-hidden="true" />
            <strong>sources :</strong> {row.source}
          </span>
        )}
      </span>
    </li>
  );
}

function InstallationCostPrerequisite({ coutInstallation }: { coutInstallation: string }) {
  return (
    <li className="flex flex-col gap-3 bg-[#FFF8E5] px-3 md:flex-row md:items-center md:justify-between py-2">
      <span className="flex items-start gap-3">
        <PrerequisiteStatusBadge status="aVerifier" />
        <span>
          <strong>Coûts d’installation : {coutInstallation}</strong>. Vérifiez votre éligibilité aux aides
        </span>
      </span>
      <Link href="https://france-renov.gouv.fr/" isExternal className="text-blue">
        En savoir plus sur les aides
      </Link>
    </li>
  );
}

function PrerequisitesList({
  rows,
  coutInstallation,
  variant,
}: {
  rows: PrerequisiteRow[];
  coutInstallation: string;
  variant: 'recommended' | 'compact';
}) {
  return (
    <div>
      <h5 className="fr-h6 mb-3 uppercase text-blue">Prérequis et faisabilité</h5>
      {variant === 'recommended' && <PrerequisitesLegend className="mb-6" />}
      <ul className="space-y-1 p-0">
        {rows.map((row, index) => (
          <PrerequisiteRowItem key={index} row={row} />
        ))}
        <InstallationCostPrerequisite coutInstallation={coutInstallation} />
      </ul>
      {variant === 'compact' && <PrerequisitesLegend className="mt-3" />}
    </div>
  );
}

type RecommendedSolutionCardProps = {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  geoAddress?: BANAddressFeature;
  coutParAnGaz: number;
  isOpen: boolean;
  onHelpButtonClick?: () => void;
  onOpenChange: (expanded: boolean) => void;
  situation: Situation;
};

function RecommendedSolutionCard({
  item,
  dpeFrom,
  geoAddress,
  coutParAnGaz,
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
        isOpen={isOpen}
        onHelpButtonClick={onHelpButtonClick}
        onOpenChange={onOpenChange}
        situation={situation}
      />
    );
  }

  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz);
  const prerequisiteRows = getPrerequisiteRows(item, situation);

  return (
    <section className="fr-mt-6w border border-gray-200 border-l-4 border-l-green-600 bg-white px-10 py-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="mb-2 text-lg font-semibold uppercase">Solution recommandée</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="mb-3 text-3xl font-bold text-blue">{item.label}</h3>
              <UsageTags usage={item.usage} />
            </div>
          </div>
          <p className="max-w-4xl">{item.description}</p>
        </div>
        <div>
          <Image src={`/${item.icone}`} alt="" width={176} height={132} className="object-contain" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} layout="column" />
        <div className=" bg-gray-100 p-5">
          <p className="mb-2 uppercase">Gain DPE</p>
          <div className="mb-4 flex items-center gap-3 border-b border-gray-300 pb-4">
            <DpeProgression from={dpeFrom} to={dpeTo} />
          </div>
          <p className="mb-1 uppercase">Coût consommation</p>
          <p className="mb-1 font-bold text-blue">
            {lowerBoundString} à {upperBoundString}
          </p>
          <p className="mb-3">par an par logement</p>
          <p className={cx('mb-0 flex items-center gap-2 font-bold', gainPercentVsGaz <= 0 ? 'text-success' : 'text-error')}>
            <span className={gainPercentVsGaz <= 0 ? 'fr-icon-arrow-right-down-line' : 'fr-icon-arrow-right-up-line'} aria-hidden="true" />
            {gainPercentVsGaz <= 0 ? '-' : '+'}
            {Math.abs(gainPercentVsGaz)} % d’économies vs gaz
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-center">
        <Button
          href={onHelpButtonClick ? undefined : '#help-ademe'}
          onClick={onHelpButtonClick}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
        >
          Passer à l’étape suivante
        </Button>
        <button
          type="button"
          className="bg-transparent p-0 text-lg text-blue underline"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Afficher moins −' : 'Afficher plus +'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-10">
          <PrerequisitesList rows={prerequisiteRows} coutInstallation={item.coutInstallation} variant="recommended" />
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
  isOpen,
  onHelpButtonClick,
  onOpenChange,
  situation,
}: RecommendedSolutionCardProps) {
  const heatNetwork = situation.eligibiliteReseauChaleur;
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz);
  const prerequisiteRows = getPrerequisiteRows(item, situation);
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

      <div className="grid gap-6 grid-1 md:grid-cols-3">
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
        <div className="bg-gray-100 p-5">
          <p className="mb-2 uppercase">Gain DPE</p>
          <div className="mb-4 flex items-center gap-3 border-b border-gray-300 pb-4">
            <DpeProgression from={dpeFrom} to={dpeTo} />
          </div>
          <p className="mb-1 uppercase">Coût consommation</p>
          <p className="mb-1 font-bold text-xl text-blue">
            {lowerBoundString} à {upperBoundString}
          </p>
          <p className="mb-3">par an par logement</p>
          <p className={cx('mb-0 flex items-center gap-2 font-bold', gainPercentVsGaz <= 0 ? 'text-success' : 'text-error')}>
            <span className={gainPercentVsGaz <= 0 ? 'fr-icon-arrow-right-down-line' : 'fr-icon-arrow-right-up-line'} aria-hidden="true" />
            {gainPercentVsGaz <= 0 ? '-' : '+'}
            {Math.abs(gainPercentVsGaz)} % d’économies vs gaz
          </p>
        </div>
        <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} />
      </div>
      <div className="mt-6 flex flex-col items-start gap-4 md:flex-row md:items-center">
        <Button
          href={onHelpButtonClick ? undefined : '#help-ademe'}
          onClick={onHelpButtonClick}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
        >
          Passer à l’étape suivante
        </Button>
        <button
          type="button"
          className="bg-transparent p-0 text-lg text-blue underline"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Lire moins −' : 'Lire plus +'}
        </button>
      </div>
      {isOpen && (
        <div className="mt-8">
          <PrerequisitesList rows={prerequisiteRows} coutInstallation={item.coutInstallation} variant="recommended" />
        </div>
      )}
    </section>
  );
}

function ResultsSection({
  title,
  items,
  coutParAnGaz,
  dpeFrom,
  openAccordionId,
  situation,
  onEditParamsClick,
  onOpenChange,
}: {
  title: string;
  items: ModeDeChauffageEnriched[];
  dpeFrom: DPE;
  openAccordionId: string | null;
  coutParAnGaz: number;
  situation: Situation;
  onEditParamsClick: () => void;
  onOpenChange: (id: string, expanded: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<ModeDeChauffageUsage>('heatingAndHotWater');
  const itemsByUsage = useMemo(
    () =>
      resultsTabs.reduce(
        (acc, tab) => ({
          ...acc,
          [tab.value]: items.filter((item) => item.usage === tab.value),
        }),
        {} as Record<ModeDeChauffageUsage, ModeDeChauffageEnriched[]>
      ),
    [items]
  );
  const activeItems = itemsByUsage[activeTab];

  useEffect(() => {
    if (activeItems.length > 0) {
      return;
    }

    const firstAvailableTab = resultsTabs.find((tab) => itemsByUsage[tab.value].length > 0);

    if (firstAvailableTab) {
      setActiveTab(firstAvailableTab.value);
    }
  }, [activeItems.length, itemsByUsage]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <h3 className="fr-mt-6w mb-5">{title}</h3>
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
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="border border-gray-200 bg-white px-5 py-6 md:px-10">
        {activeTab === 'hotWaterOnly' && (
          <>
            <div className="mb-6 border-l-4 border-blue bg-gray-100 px-4 py-3">
              <div className="flex items-start gap-3">
                <span
                  className="fr-icon-information-fill mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-sm text-white"
                  aria-hidden="true"
                />
                <div>
                  <p className="mb-1 font-bold text-blue">Mode actuel : Individuel</p>
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
          </>
        )}
        {activeItems.map((item) => {
          const id = item.label;

          return (
            <OtherSolutionRow
              key={id}
              item={item}
              coutParAnGaz={coutParAnGaz}
              dpeFrom={dpeFrom}
              situation={situation}
              isOpen={openAccordionId === id}
              onOpenChange={(expanded) => onOpenChange(id, expanded)}
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

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} étoiles`}>
      {Array.from({ length: value }).map((_, index) => (
        <Image key={index} src="/icons/icon-star.png" alt="" aria-hidden="true" width="20" height="20" />
      ))}
      <Tooltip
        iconProps={{
          className: 'text-blue',
        }}
        title="Classement Ademe ENR Choix"
      />
    </div>
  );
}

function GainVsGazBadge({ item, coutParAnGaz }: { item: ModeDeChauffageEnriched; coutParAnGaz: number }) {
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz);
  const isSaving = gainPercentVsGaz <= 0;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 whitespace-nowrap bg-[#E3FDEB] px-3 py-2 font-bold',
        isSaving ? 'text-success' : 'bg-[#FFE9E6] text-error'
      )}
    >
      <span
        className={cx(
          'flex h-6 w-6 items-center justify-center rounded-full text-white',
          isSaving ? 'bg-success fr-icon-arrow-right-down-line' : 'bg-error fr-icon-arrow-right-up-line'
        )}
        aria-hidden="true"
      />
      {isSaving ? '-' : '+'}
      {Math.abs(gainPercentVsGaz)} % {isSaving ? 'd’économies vs gaz' : 'vs gaz'}
    </span>
  );
}

function OtherSolutionRow({
  item,
  dpeFrom,
  coutParAnGaz,
  isOpen,
  situation,
  onOpenChange,
}: {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  coutParAnGaz: number;
  isOpen: boolean;
  situation: Situation;
  onOpenChange: (expanded: boolean) => void;
}) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const prerequisiteRows = getPrerequisiteRows(item, situation);

  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      <div className="grid gap-5 md:grid-cols-[minmax(12rem,2fr)_minmax(9rem,1fr)_max-content_max-content_max-content] md:items-center">
        <div>
          <p className="mb-3 text-blue font-bold">{item.label}</p>
          <Stars value={item.pertinence} />
        </div>
        <div className="text-center">
          <span className="font-bold text-blue">
            {lowerBoundString} à {upperBoundString}
          </span>
          <br />
          <span>par an par logement</span>
        </div>
        <GainVsGazBadge item={item} coutParAnGaz={coutParAnGaz} />
        <div className="flex items-center gap-3 md:justify-self-center">
          <DpeProgression from={dpeFrom} to={dpeTo} />
        </div>
        <button
          type="button"
          className="justify-self-start whitespace-nowrap text-blue underline md:justify-self-end"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Fermer −' : 'Ouvrir +'}
        </button>
      </div>
      {isOpen && (
        <>
          <div className="grid gap-5 grid-cols-5 border-t border-gray-200 pt-6">
            <div className="col-span-2">
              <h4 className="text-lg uppercase">Description</h4>
              <p className="mb-0">{item.description}</p>
            </div>
            <div className="col-span-2">
              <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} />
            </div>
            <div>
              <Image
                src={`/${item.icone}`}
                alt=""
                width={144}
                height={108}
                className="justify-self-center object-contain md:justify-self-end"
              />
            </div>
          </div>
          <div className="mt-6">
            <PrerequisitesList rows={prerequisiteRows} coutInstallation={item.coutInstallation} variant="compact" />
            <Button href="#help-ademe" iconId="fr-icon-arrow-right-line" iconPosition="right" className="mt-3">
              Passer à l’étape suivante
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function NoResultSection({ codeInsee }: { codeInsee?: string }) {
  const renovationActions = [
    {
      description: 'toiture, murs, fenêtres, planchers, c’est souvent le geste le plus efficace',
      title: 'Isoler votre logement',
    },
    {
      description: 'une VMC performante améliore la qualité de l’air et limite les pertes de chaleur',
      title: 'Améliorer votre système de ventilation',
    },
    {
      description: 'entretien de la chaudière, désembouage des radiateurs, installation de robinets thermostatiques',
      title: 'Optimiser votre chauffage actuel',
    },
    {
      description: 'mousseurs, pommeaux économes, calorifugeage des tuyaux',
      title: 'Réduire vos consommations d’eau chaude',
    },
  ];

  return (
    <>
      <section className="mt-6 border border-[#e5e5e5] border-l-4 border-l-[#c74700] bg-white px-6 py-5 text-(--text-title-grey)">
        <h3 className="mb-4 flex items-start gap-2 text-xl font-bold">
          <span className="fr-icon-information-line mt-0.5 text-[#c74700]" aria-hidden="true" />
          Aucune solution de chauffage alternatif n’est adaptée à votre situation
        </h3>
        <p className="mb-4 max-w-5xl">
          Pas d’inquiétude, d’autres actions permettent de réduire vos consommations d’énergie, vos factures et votre impact environnemental
          :
        </p>
        <ul className="mb-4 space-y-2 pl-0">
          {renovationActions.map((action) => (
            <li key={action.title} className="flex items-start gap-2">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-xs border border-blue" aria-hidden="true" />
              <span>
                <strong>{action.title}</strong> : {action.description}
              </span>
            </li>
          ))}
        </ul>
        <p className="mb-3">Ces travaux peuvent être éligibles à des aides financières (MaPrimeRénov’, CEE, éco-prêt à taux zéro).</p>
        <p className="mb-0 font-bold">
          <span className="fr-icon-search-line mr-1 text-sm" aria-hidden="true" />
          Pour encore plus d’actions possibles,&nbsp;
          <Link
            href="https://agirpourlatransition.ademe.fr/particuliers/"
            isExternal
            className="font-normal underline underline-offset-4"
            postHogEventKey="link:click"
            postHogEventProps={{ link_name: 'agir_actions_renovation', source: 'chaleur_renouvelable' }}
          >
            rendez-vous sur Agir
          </Link>
        </p>
      </section>
      <FranceRenovHelp codeInsee={codeInsee} />
    </>
  );
}
