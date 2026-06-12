import Link from '@/components/ui/Link';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { PrerequisiteRow } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import cx from '@/utils/cx';

import { PrerequisiteStatusBadge } from './PrerequisiteStatusBadge';

function PrerequisiteRowItem({ row }: { row: PrerequisiteRow }) {
  return (
    <li
      className={cx(
        'flex flex-col gap-3 px-3 py-2 md:flex-row md:items-center md:justify-between',
        row.status === 'favorable' ? 'bg-gray-100' : 'bg-[#FFF8E5]'
      )}
    >
      <span className="flex flex-col md:flex-row items-center gap-3">
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
        <PrerequisiteStatusBadge status="averifier" />
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
