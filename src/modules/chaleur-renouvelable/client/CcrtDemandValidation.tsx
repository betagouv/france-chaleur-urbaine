import AsyncButton from '@/components/ui/AsyncButton';
import trpc from '@/modules/trpc/client';

import { ccrtArchiveReasons } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtDemandModerationMenu } from './CcrtDemandModerationMenu';
import { invalidateCcrtModeration } from './ccrt-demand-cache';

type CcrtDemandValidationProps = { demand: CcrtDemand; full?: boolean; onValidate: (demandId: string) => Promise<void> };

/**
 * Keeps publication controls identical in desktop rows and mobile cards.
 */
export function CcrtDemandValidation({ demand, full, onValidate }: CcrtDemandValidationProps) {
  const restore = trpc.batEnr.admin.restoreDemand.useMutation();
  const utils = trpc.useUtils();
  if (demand.archived_at !== null) {
    return (
      <div className="space-y-2 text-left text-sm">
        <p className="mb-0">
          {demand.transferred_network_name
            ? `Transférée à ${demand.transferred_network_name}`
            : `Archivée : ${ccrtArchiveReasons.find((reason) => reason.value === demand.archive_reason)?.label ?? ''}`}
        </p>
        {demand.archive_comment && <p className="mb-0 whitespace-pre-wrap">{demand.archive_comment}</p>}
        {!demand.transferred_network_name && (
          <AsyncButton
            full={full}
            priority="secondary"
            onClick={async () => {
              await restore.mutateAsync({ demandId: demand.id });
              await invalidateCcrtModeration(utils, demand.id);
            }}
          >
            Restaurer
          </AsyncButton>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <AsyncButton
        priority="primary"
        full={full}
        iconId="fr-icon-check-line"
        iconPosition="right"
        title="Valider la demande et la rendre visible aux CCRT autorisés"
        onClick={() => onValidate(demand.id)}
      >
        Valider
      </AsyncButton>
      <CcrtDemandModerationMenu demandId={demand.id} full={full} />
    </div>
  );
}
