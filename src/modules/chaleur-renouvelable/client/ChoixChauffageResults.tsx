import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getCostPrecisionRange } from '@/components/ComparateurPublicodes/Graph';
import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import { EligibilityFormContact } from '@/components/EligibilityForm';
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
import DemandeFCRForm from '@/modules/chaleur-renouvelable/client/DemandFCRForm';
import FranceRenovHelp from '@/modules/chaleur-renouvelable/client/FranceRenovHelp';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/hooks/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { useRemoveHashOnScroll } from '@/modules/chaleur-renouvelable/client/hooks/useRemoveHashOnScroll';
import {
  DPE_BG,
  improveDpe,
  type ModeDeChauffage,
  type ModeDeChauffageEnriched,
  type ModeDeChauffageUsage,
  modeDeChauffageParTypeLogement,
  type Situation,
} from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import type { DPE, ModeEauChaudeSanitaire, TypeLogement } from '@/modules/chaleur-renouvelable/constants';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';
import cx from '@/utils/cx';

import { HOT_WATER_PARAMS_SECTION_ID, ParamsForm } from './ParamsForm';

type PrerequisiteStatus = 'favorable' | 'contraignant' | 'aVerifier';

type PrerequisiteRow = {
  label: ReactNode;
  source?: string;
  status: PrerequisiteStatus;
};

type IncompatibleSolutionRow = {
  label: string;
  reason: string;
  source: string;
};

type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

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
    codeDepartement,
    eligibiliteReseauChaleur,
    temperatureRef,
    onSelectGeoAddress,
    resetEligibility,
  } = useAddressEligibility(urlParams.adresse ?? null);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
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
      dpe: urlParams.dpe,
      eligibiliteReseauChaleur,
      espaceExterieur: urlParams.espaceExterieur ?? 'none',
      geothermiePossible: batEnr.geothermiePossible,
      habitantsMoyen: Number.parseFloat(urlParams.habitantsMoyen || '2'),
      nbLogements: urlParams.nbLogements ?? 25,
      planProtectionAtmosphere: batEnr.planProtectionAtmosphere,
      surfaceMoyenne: urlParams.surfaceMoyenne ?? 70,
    }),
    [
      urlParams.adresse,
      urlParams.dpe,
      urlParams.espaceExterieur,
      urlParams.habitantsMoyen,
      urlParams.nbLogements,
      urlParams.surfaceMoyenne,
      batEnr.geothermiePossible,
      batEnr.planProtectionAtmosphere,
      eligibiliteReseauChaleur,
    ]
  );

  // Pousse la situation dans Publicodes dès qu’elle change
  useEffect(() => {
    if (!codeDepartement) return;

    const modeEauChaudeSanitaire = (urlParams.modeEauChaudeSanitaire ?? 'equipement-chauffage') as ModeEauChaudeSanitaire;
    const currentEngine = engineRef.current;

    currentEngine.setSituation({
      'code département': `'${codeDepartement}'`,
      DPE: `'${situation.dpe}'`,
      'Inclure la climatisation': 'non',
      "Nombre d'habitants moyen par appartement": `${situation.habitantsMoyen}`,
      "nombre de logements dans l'immeuble concerné": situation.nbLogements,
      'Production eau chaude sanitaire': modeEauChaudeSanitaire === 'non' ? 'non' : 'oui',
      'surface logement type tertiaire': `${situation.surfaceMoyenne}`,
      'température de référence chaud commune': temperatureRef,
    });

    if (modeEauChaudeSanitaire === 'non' || modeEauChaudeSanitaire === 'equipement-chauffage') {
      currentEngine.resetField('type de production ECS');
      return;
    }

    currentEngine.setStringField(
      'type de production ECS',
      modeEauChaudeSanitaire === 'chauffe-eau-electrique' ? 'Chauffe-eau électrique' : 'Solaire thermique'
    );
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
      if (!geoAddress) {
        resetEligibility();
        return;
      }
      onSelectGeoAddress(geoAddress);
    },
    [onSelectGeoAddress, resetEligibility]
  );
  const helpButtonClick = recommended?.helpAction === 'open-heat-network-contact' ? openHeatNetworkContactModal : undefined;

  // pendant l’hydration, on évite de rendre conditionnellement (isMobile null)
  if (isMobile === null) return null;

  return (
    <>
      <ParamsForm
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        values={urlParams.simulationParams}
        onSave={urlParams.setSimulationParams}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onAddressError={() => {}}
      />
      {modesEnriched.length > 0 ? (
        <>
          <RecommendedSolutionCard
            item={recommended}
            coutParAnGaz={coutParAnGaz}
            dpeFrom={urlParams.dpe}
            isOpen={openAccordionId === recommended.label}
            onHelpButtonClick={helpButtonClick}
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
          <DemandeFCRForm />
          <IncompatibleSolutionsSection rows={incompatibleSolutionRows} />
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

function DpeTag({ letter }: { letter: DPE }) {
  return (
    <div
      className={cx('flex h-12 w-12 items-center justify-center rounded-sm', DPE_BG[letter])}
      aria-label={`Classe énergétique ${letter}`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
        <span className="font-bold">{letter}</span>
      </div>
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
  return item.contraintesTechniques.map((contrainteTechnique) => {
    const label = contrainteTechnique;
    const text = typeof contrainteTechnique === 'string' ? contrainteTechnique : '';

    if (text.includes('PPA') || text.includes('qualité de l’air')) {
      return {
        label: 'Restrictions liées à un Plan de Protection de l’Atmosphère (PPA)',
        source: 'Cerema',
        status: situation.planProtectionAtmosphere ? 'contraignant' : 'favorable',
      };
    }

    if (text.includes('Proximité à un réseau') || text.includes('zone de développement prioritaire')) {
      return {
        label,
        source: 'FCU',
        status: situation.eligibiliteReseauChaleur ? 'favorable' : 'aVerifier',
      };
    }

    if (text.includes('forage')) {
      return {
        label,
        source: 'BRGM',
        status: situation.geothermiePossible ? 'favorable' : 'aVerifier',
      };
    }

    return {
      label,
      status: 'aVerifier',
    };
  });
}

function getIncompatibleSolutionRows(situation: Situation, typeLogement: TypeLogement): IncompatibleSolutionRow[] {
  if (typeLogement !== 'immeuble_chauffage_collectif') {
    return [];
  }

  const rows: IncompatibleSolutionRow[] = [];

  if (!situation.eligibiliteReseauChaleur?.isEligible) {
    rows.push({
      label: 'Réseau de chaleur',
      reason: 'Votre adresse n’est pas raccordable à un réseau de chaleur',
      source: 'France Chaleur Urbaine',
    });
  }

  if (!situation.geothermiePossible) {
    rows.push({
      label: 'PAC géothermique',
      reason: 'Votre terrain n’a pas de potentiel géothermique suffisant',
      source: 'BRGM',
    });
  }

  return rows;
}

function PrerequisiteStatusBadge({ status }: { status: PrerequisiteStatus }) {
  const config = {
    aVerifier: {
      className: 'bg-[#FEECC2] text-[#716043]',
      label: 'À VÉRIFIER',
    },
    contraignant: {
      className: 'bg-[#FFE9E6] text-[#B34000]',
      label: 'CONTRAIGNANT',
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
        <ul className="m-0 list-none space-y-3 p-0">
          {rows.map((row) => (
            <li key={row.label} className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-4">
              <div className="flex items-center gap-3">
                <span className="fr-icon-close-line text-[#B34000]" aria-hidden="true" />
                <strong className="whitespace-nowrap text-[#B34000]">{row.label}</strong>
                <span>{row.reason}</span>
              </div>
              <span className="justify-self-start whitespace-nowrap text-blue md:justify-self-end">
                <span className="fr-icon-stack-line font-bold" aria-hidden="true" /> {row.source}
              </span>
              <span className="justify-self-start rounded-sm bg-[#FFE9E6] px-2 py-1 text-xs font-bold text-[#B34000] md:justify-self-end">
                DÉFAVORABLE
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
        <span key={tag.label} className="inline-flex items-center gap-2 rounded-sm border border-(--border-default-grey) px-3 py-2 text-sm">
          <Image src={tag.icon} alt="" width={20} height={20} aria-hidden="true" />
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

function ProsConsLists({
  avantages,
  inconvenients,
  headingLevel,
  layout,
}: {
  avantages: string[];
  inconvenients: string[];
  headingLevel: 'h4' | 'h5';
  layout: 'columns' | 'stacked';
}) {
  const Heading = headingLevel;
  const headingClassName = cx('fr-h6 uppercase', layout === 'columns' ? 'mb-4 font-normal' : 'mb-3');

  return (
    <div className={layout === 'columns' ? 'contents' : undefined}>
      <div>
        <Heading className={cx(headingClassName, 'text-success')}>Avantages</Heading>
        <ul className="m-0 list-none space-y-1 p-0">
          {avantages.map((avantage) => (
            <li key={avantage} className="flex gap-3">
              <span className="fr-icon-check-line text-success" aria-hidden="true" />
              <span>{avantage}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={layout === 'stacked' ? 'mt-6' : undefined}>
        <Heading className={cx(headingClassName, 'text-[#B34000]')}>Inconvénients</Heading>
        <ul className="m-0 list-none space-y-1 p-0">
          {inconvenients.map((inconvenient) => (
            <li key={inconvenient} className="flex gap-3">
              <span className="fr-icon-close-line text-[#B34000]" aria-hidden="true" />
              <span>{inconvenient}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PrerequisitesLegend({ className, withStatusLabel = false }: { className?: string; withStatusLabel?: boolean }) {
  return (
    <p className={cx('text-sm', className)}>
      {withStatusLabel && <strong>STATUT :</strong>} <strong className="text-success">FAVORABLE</strong> : vérifié, aucun obstacle{' '}
      <strong className="text-[#B34000]">CONTRAIGNANT</strong> : vérifié, contraintes supplémentaires{' '}
      <strong className="text-[#716043]">À VÉRIFIER</strong> : à vérifier par vous
    </p>
  );
}

function PrerequisiteRowItem({ row, variant }: { row: PrerequisiteRow; variant: 'recommended' | 'compact' }) {
  const isCompact = variant === 'compact';

  return (
    <li
      className={cx(
        'flex flex-col gap-3 px-3 py-2 md:flex-row md:items-center md:justify-between',
        row.status === 'favorable' ? 'bg-gray-100' : 'bg-[#FFF8E5]'
      )}
    >
      <span className={cx('flex gap-3', isCompact ? 'items-start text-sm' : 'items-center')}>
        <span
          className={cx(
            'items-center justify-center rounded-sm border border-(--border-action-high-blue-france)',
            isCompact ? 'mt-1 inline-flex h-4 w-4 shrink-0' : 'h-5 w-5',
            row.status === 'favorable' && 'bg-(--background-action-high-blue-france) fr-icon-check-line text-white'
          )}
          aria-hidden="true"
        />
        <span>{row.label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3 self-end md:self-auto">
        {row.source && (
          <span className={cx('text-blue', isCompact && 'text-sm')}>
            <span className="fr-icon-stack-line font-bold" aria-hidden="true" /> {row.source}
          </span>
        )}
        <PrerequisiteStatusBadge status={row.status} />
      </span>
    </li>
  );
}

function InstallationCostPrerequisite({ coutInstallation, variant }: { coutInstallation: string; variant: 'recommended' | 'compact' }) {
  const isCompact = variant === 'compact';

  return (
    <li className={cx('flex flex-col gap-3 bg-[#FFF8E5] px-3 md:flex-row md:items-center md:justify-between', isCompact ? 'py-2' : 'py-3')}>
      <span className={cx('flex items-start gap-3', isCompact && 'text-sm')}>
        <span
          className={cx('shrink-0 rounded-sm border border-(--border-action-high-blue-france)', isCompact ? 'mt-1 h-4 w-4' : 'h-5 w-5')}
          aria-hidden="true"
        />
        <span>
          <strong>{coutInstallation} : </strong>
          {isCompact
            ? 'Coûts d’installation, vérifiez les aides publiques disponibles'
            : 'Coût d’installation - vérifiez les aides publiques disponibles'}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3 self-end md:self-auto">
        <Link
          href="https://france-renov.gouv.fr/"
          isExternal
          className={isCompact ? 'text-sm text-(--text-action-high-blue-france)' : 'text-blue'}
        >
          En savoir plus
          {isCompact && <span className="fr-icon-arrow-right-up-line" aria-hidden="true" />}
        </Link>
        <PrerequisiteStatusBadge status="aVerifier" />
      </span>
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
  if (variant === 'recommended') {
    return (
      <div className="mt-10">
        <h4 className="mb-6 text-xl uppercase text-blue">Prérequis et faisabilité</h4>
        <PrerequisitesLegend className="mb-6" withStatusLabel />
        <ul className="m-0 list-none space-y-3 p-0">
          {rows.map((row, index) => (
            <PrerequisiteRowItem key={index} row={row} variant="recommended" />
          ))}
          <InstallationCostPrerequisite coutInstallation={coutInstallation} variant="recommended" />
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h5 className="fr-h6 mb-3 uppercase text-blue">Prérequis et faisabilité</h5>
      <ul className="m-0 list-none space-y-1 p-0">
        {rows.map((row, index) => (
          <PrerequisiteRowItem key={index} row={row} variant="compact" />
        ))}
        <InstallationCostPrerequisite coutInstallation={coutInstallation} variant="compact" />
      </ul>
      <PrerequisitesLegend className="mt-3" />
    </div>
  );
}

function RecommendedSolutionCard({
  item,
  dpeFrom,
  coutParAnGaz,
  isOpen,
  onHelpButtonClick,
  onOpenChange,
  situation,
}: {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  coutParAnGaz: number;
  isOpen: boolean;
  onHelpButtonClick?: () => void;
  onOpenChange: (expanded: boolean) => void;
  situation: Situation;
}) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz);
  const prerequisiteRows = getPrerequisiteRows(item, situation);

  return (
    <section className="fr-mt-6w border border-gray-200 border-l-4 border-l-green-600 bg-white px-5 py-6 md:px-10 md:py-8">
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
          <Image src={`/${item.icone}`} alt="" width={176} height={132} className="self-center object-contain md:self-start" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} headingLevel="h4" layout="columns" />

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
          <p
            className={cx('mb-0 flex items-center gap-2 font-bold', gainPercentVsGaz <= 0 ? 'text-success' : 'text-(--text-default-error)')}
          >
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

      {isOpen && <PrerequisitesList rows={prerequisiteRows} coutInstallation={item.coutInstallation} variant="recommended" />}
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
                isActive ? 'border-(--border-action-high-blue-france) border-t-4 bg-white text-blue' : 'border-transparent bg-[#EEEEFF] '
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
        isSaving ? 'text-success' : 'bg-[#FFE9E6] text-(--text-default-error)'
      )}
    >
      <span
        className={cx(
          'flex h-6 w-6 items-center justify-center rounded-full text-white',
          isSaving ? 'bg-[#18753C] fr-icon-arrow-right-down-line' : 'bg-[#B34000] fr-icon-arrow-right-up-line'
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
    <article className="border-b border-gray-200 py-6 last:border-b-0">
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
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex gap-6">
            <p className="mb-0">{item.description}</p>
            <Image
              src={`/${item.icone}`}
              alt=""
              width={144}
              height={108}
              className="justify-self-center object-contain md:justify-self-end"
            />
          </div>

          <div className="mt-6 flex gap-8">
            <div>
              <ProsConsLists avantages={item.avantages} inconvenients={item.inconvenients} headingLevel="h5" layout="stacked" />
            </div>

            <div>
              <PrerequisitesList rows={prerequisiteRows} coutInstallation={item.coutInstallation} variant="compact" />
              <Button href="#help-ademe" iconId="fr-icon-arrow-right-line" iconPosition="right" className="mt-3">
                Passer à l’étape suivante
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function NoResultSection({ codeInsee }: { codeInsee?: string }) {
  return (
    <>
      <h3>Aucune solution de chauffage alternative n'est adaptée à votre situation actuelle</h3>
      <p>
        Pas d'inquiétude, d'autres actions permettent de réduire vos consommations d'énergie, vos factures et votre impact environnemental :
      </p>
      <ul>
        <li>
          <strong>Isoler votre logement</strong> : toiture, murs, fenêtres, planchers — c'est souvent le geste le plus efficace
        </li>
        <li>
          <strong>Améliorer votre système de ventilation</strong> : une VMC performante améliore la qualité de l'air et limite les pertes de
          chaleur
        </li>
        <li>
          <strong>Optimiser votre chauffage actuel</strong> : entretien de la chaudière, désembouage des radiateurs, installation de
          robinets thermostatiques
        </li>
        <li>
          <strong>Réduire vos consommations d'eau chaude</strong> : mousseurs, pommeaux économes, calorifugeage des tuyaux
        </li>
      </ul>
      <p>Ces travaux peuvent être éligibles à des aides financières (MaPrimeRénov', CEE, éco-prêt à taux zéro).</p>
      <FranceRenovHelp codeInsee={codeInsee} />
    </>
  );
}
