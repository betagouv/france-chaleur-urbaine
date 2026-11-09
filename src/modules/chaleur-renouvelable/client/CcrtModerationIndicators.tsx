import Accordion from '@/components/ui/Accordion';

import { ccrtArchiveReasons } from '../constants';
import type { CcrtDemand } from '../types';

type CcrtModerationIndicatorsProps = { demands: CcrtDemand[] };

/**
 * Displays the moderation funnel independently from the current search and filters.
 */
export function CcrtModerationIndicators({ demands }: CcrtModerationIndicatorsProps) {
  const validated = demands.filter((demand) => demand.validated).length;
  const archived = demands.filter((demand) => demand.archive_reason !== null);
  const transferred = demands.filter((demand) => demand.transferred_network_name !== null).length;
  const pending = demands.length - validated - archived.length - transferred;
  return (
    <Accordion label="Indicateurs de traitement" simple lazy className="mb-6">
      <p className="mb-3">Répartition actuelle de l’ensemble des demandes reçues, indépendamment des filtres.</p>
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Demandes entrantes', demands.length],
          ['Transmises aux CCRT', validated],
          ['À valider', pending],
          ['Non validées', archived.length + transferred],
        ].map(([label, count]) => (
          <li key={label} className="border border-(--border-default-grey) p-3">
            <strong className="block text-2xl">{count}</strong>
            {label}
          </li>
        ))}
      </ol>
      <p className="mb-1 mt-4">
        Transférées à un gestionnaire de réseau : <strong>{transferred}</strong> · Archivées : <strong>{archived.length}</strong>
      </p>
      <ul className="mb-0">
        {ccrtArchiveReasons.map((reason) => (
          <li key={reason.value}>
            {reason.label} : {archived.filter((demand) => demand.archive_reason === reason.value).length}
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
