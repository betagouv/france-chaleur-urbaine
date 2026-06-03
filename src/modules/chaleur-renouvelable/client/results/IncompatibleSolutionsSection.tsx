import type { IncompatibleSolutionRow } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { PrerequisiteStatusBadge } from '@/modules/chaleur-renouvelable/client/results/SolutionCommon';

type IncompatibleSolutionsSectionProps = {
  rows: IncompatibleSolutionRow[];
};

export function IncompatibleSolutionsSection({ rows }: IncompatibleSolutionsSectionProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="fr-mt-6w mb-5">Solutions non compatibles</h3>
      <div className="border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <ul className="m-0 space-y-3 p-0">
          {rows.map((row) => (
            <li key={`${row.label}-${row.reason}`} className="grid gap-2 md:grid-cols-[auto_2fr_3fr_auto] md:items-center md:gap-4">
              <PrerequisiteStatusBadge status="defavorable" />
              <strong className="whitespace-nowrap text-error">{row.label}</strong>
              <span>{row.reason}</span>
              <span className="w-fit justify-self-start whitespace-nowrap text-blue md:justify-self-end">
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
