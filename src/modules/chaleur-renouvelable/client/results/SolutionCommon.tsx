import { getCostPrecisionRange } from '@/components/ComparateurPublicodes/Graph';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import { trackPostHogEvent } from '@/modules/analytics/client';
import {
  improveDpe,
  type ModeDeChauffageEnriched,
  type ModeDeChauffageUsage,
  type PrerequisiteRow,
  type PrerequisiteStatus,
} from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import type { DPE } from '@/modules/chaleur-renouvelable/constants';
import cx from '@/utils/cx';

const DPE_BG: Record<DPE, string> = {
  A: 'bg-[#00A06C]',
  B: 'bg-[#52B053]',
  C: 'bg-[#A6CB71]',
  D: 'bg-[#F5E70F]',
  E: 'bg-[#F0B50E]',
  F: 'bg-[#EC8136]',
  G: 'bg-[#D7211F]',
};

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

export function getGainPercentVsGaz(item: ModeDeChauffageEnriched, coutParAnGaz: number, coutParAnGazHotWaterOnly: number) {
  if (item.usage !== 'hotWaterOnly' && item.gainVsGaz !== undefined) {
    return item.gainVsGaz;
  }

  const referenceCost = item.usage === 'hotWaterOnly' ? coutParAnGazHotWaterOnly : coutParAnGaz;

  return referenceCost > 0 ? Math.round(((item.coutParAn - referenceCost) / referenceCost) * 100) : 0;
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

export function UsageTags({ usage }: { usage: ModeDeChauffageUsage }) {
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

export function DpeProgression({ from, to }: { from: DPE; to: DPE }) {
  return (
    <div className="flex items-center gap-3">
      <DpeTag letter={from} />
      <span>→</span>
      <DpeTag letter={to} />
    </div>
  );
}

export function ProsConsLists({ avantages, inconvenients }: { avantages: string[]; inconvenients: string[] }) {
  return (
    <div>
      <h4 className="text-lg font-bold uppercase">
        <span className="text-success">Avantages</span>
        <span className="mx-3 inline-block font-normal">/</span>
        <span className="text-error">Inconvénients</span>
      </h4>
      <ul className="p-0">
        {avantages.map((avantage) => (
          <li key={avantage} className="flex gap-3">
            <span className="fr-icon-check-line text-success" aria-hidden="true" />
            <span>{avantage}</span>
          </li>
        ))}
      </ul>
      <ul className="p-0">
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

export function PrerequisiteStatusBadge({ status }: { status: PrerequisiteStatus }) {
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

  return <span className={cx('w-fit rounded-sm px-2 py-1 text-sm font-bold', config[status].className)}>{config[status].label}</span>;
}

function PrerequisiteRowItem({ row }: { row: PrerequisiteRow }) {
  return (
    <li
      className={cx(
        'flex flex-col gap-3 px-3 py-2 md:flex-row md:items-center md:justify-between',
        row.status === 'favorable' ? 'bg-gray-100' : 'bg-[#FFF8E5]'
      )}
    >
      <span className="flex items-center gap-3">
        <PrerequisiteStatusBadge status={row.status} />
        <span>{row.label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3 self-end md:self-auto">
        {row.source && (
          <span className="text-blue">
            <span className="fr-icon-stack-line mr-1 font-bold" aria-hidden="true" />
            <strong>sources :</strong> {row.source}
          </span>
        )}
      </span>
    </li>
  );
}

function InstallationCostPrerequisite({ coutInstallation, solutionType }: { coutInstallation: string; solutionType: string }) {
  return (
    <li className="flex flex-col gap-3 bg-[#FFF8E5] px-3 py-2 md:flex-row md:items-center md:justify-between">
      <span className="flex items-start gap-3">
        <PrerequisiteStatusBadge status="aVerifier" />
        <span>
          <strong>Coûts d’installation : {coutInstallation}</strong>. Vérifiez votre éligibilité aux aides
        </span>
      </span>
      <Link
        href="https://france-renov.gouv.fr/"
        isExternal
        className="text-blue"
        onClick={() =>
          trackPostHogEvent('fcr_results:prerequisite_detail_clicked', {
            prerequisite_label: 'Coûts d’installation',
            solution_type: solutionType,
          })
        }
      >
        En savoir plus sur les aides
      </Link>
    </li>
  );
}

function PrerequisitesLegend({ className }: { className?: string }) {
  return (
    <p className={cx('text-sm', className)}>
      <strong>STATUT :</strong> <strong className="text-success">FAVORABLE</strong> : vérifié, aucun obstacle{' '}
      <strong className="text-error ml-3">CONTRAIGNANT</strong> : vérifié, contraintes supplémentaires{' '}
      <strong className="text-[#716043] ml-3">À VÉRIFIER</strong> : à vérifier par vous
    </p>
  );
}

type PrerequisitesListProps = {
  rows: PrerequisiteRow[];
  coutInstallation: string;
  solutionType: string;
  variant: 'recommended' | 'compact';
};

export function PrerequisitesList({ rows, coutInstallation, solutionType, variant }: PrerequisitesListProps) {
  return (
    <div>
      <h5 className="fr-h6 mb-3 uppercase text-blue">Prérequis et faisabilité</h5>
      {variant === 'recommended' && <PrerequisitesLegend className="mb-6" />}
      <ul className="space-y-1 p-0">
        {rows.map((row, index) => (
          <PrerequisiteRowItem key={index} row={row} />
        ))}
        <InstallationCostPrerequisite coutInstallation={coutInstallation} solutionType={solutionType} />
      </ul>
      {variant === 'compact' && <PrerequisitesLegend className="mt-3" />}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
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

export function GainVsGazBadge({
  item,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
}: {
  item: ModeDeChauffageEnriched;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
}) {
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz, coutParAnGazHotWaterOnly);
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
      {Math.abs(gainPercentVsGaz)} % 'd’économies vs gaz
    </span>
  );
}

type SolutionConsumptionPanelProps = {
  dpeFrom: DPE;
  item: ModeDeChauffageEnriched;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  className?: string;
};

export function SolutionConsumptionPanel({
  dpeFrom,
  item,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  className,
}: SolutionConsumptionPanelProps) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz, coutParAnGazHotWaterOnly);

  return (
    <div className={cx('bg-gray-100 p-5', className)}>
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
  );
}

export function SolutionCta({
  item,
  onHelpButtonClick,
  className,
}: {
  item: ModeDeChauffageEnriched;
  onHelpButtonClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      href={onHelpButtonClick ? undefined : '#help-ademe'}
      onClick={() => {
        trackPostHogEvent('fcr_results:recommended_solution_cta_clicked', { solution_type: item.label });
        onHelpButtonClick?.();
      }}
      iconId="fr-icon-arrow-right-line"
      iconPosition="right"
      className={className}
    >
      Passer à l’étape suivante
    </Button>
  );
}
