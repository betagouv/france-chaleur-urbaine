import type { IncompatibleSolutionRow } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { PrerequisiteStatusBadge } from '@/modules/chaleur-renouvelable/client/results/ui/PrerequisiteStatusBadge';

export function IncompatibleSolutionsSection({ rows }: { rows: IncompatibleSolutionRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="fr-mt-6w mb-5">Solutions non compatibles</h3>
      <div className="border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="align-top">
                  <td className="py-3">
                    <PrerequisiteStatusBadge status="defavorable" />
                  </td>
                  <td className="p-3 max-w-62.5 text-error text-lg">{row.label}</td>
                  <td className="py-3">
                    <div className="space-y-2">
                      {row.reasons.map(({ reason, source }) => (
                        <div
                          key={`${reason}-${source}`}
                          className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4"
                        >
                          <span>{reason}</span>
                          <span className="w-fit shrink-0 whitespace-nowrap text-blue">
                            <span className="fr-icon-stack-line mr-1 font-bold" aria-hidden="true" />
                            source : {source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end text-sm">
          <span className="fr-icon-stack-line mr-2" aria-hidden="true" />
          Vérifié automatiquement à partir de votre adresse et de vos paramètres
        </div>
      </div>
    </section>
  );
}
