import Badge from '@codegouvfr/react-dsfr/Badge';

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
        <Badge small noIcon severity={demand.transferred_network_name ? 'info' : undefined} className="max-w-full whitespace-normal!">
          {demand.transferred_network_name ? `Transférée` : `Archivée`}
        </Badge>
        {demand.transferred_network_name
          ? demand.transferred_network_name
          : (ccrtArchiveReasons.find((reason) => reason.value === demand.archive_reason)?.label ?? '')}
        {demand.archive_comment && <p className="mb-0 whitespace-pre-wrap">{demand.archive_comment}</p>}
        <AsyncButton
          priority="tertiary no outline"
          size="small"
          className="h-auto! min-h-0! p-0! underline"
          onClick={async () => {
            await restore.mutateAsync({ demandId: demand.id });
            await invalidateCcrtModeration(utils, demand.id);
          }}
        >
          Annuler
        </AsyncButton>
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
