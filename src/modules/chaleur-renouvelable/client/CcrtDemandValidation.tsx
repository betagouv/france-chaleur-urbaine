import { useState } from 'react';

import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import trpc from '@/modules/trpc/client';

import { ccrtArchiveReasons } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtArchiveForm } from './CcrtArchiveForm';
import { CcrtTransferForm } from './CcrtTransferForm';
import { invalidateCcrtModeration } from './ccrt-demand-cache';
import { getCcrtAccessWarning } from './ccrt-workspace';

type CcrtDemandValidationProps = { demand: CcrtDemand; full?: boolean; onValidate: (demandId: string) => Promise<void> };

/**
 * Keeps publication controls identical in desktop rows and mobile cards.
 */
export function CcrtDemandValidation({ demand, full, onValidate }: CcrtDemandValidationProps) {
  const [mode, setMode] = useState<'choice' | 'archive' | 'transfer' | null>(null);
  const restore = trpc.batEnr.admin.restoreDemand.useMutation();
  const utils = trpc.useUtils();
  const warning = getCcrtAccessWarning(demand.access_users);
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
      {warning && (
        <p className="mb-0 text-left text-sm text-(--text-default-warning)">
          <span aria-hidden className="fr-icon-warning-fill mr-1" />
          {warning}
        </p>
      )}
      <Button full={full} priority="secondary" size="small" onClick={() => setMode('choice')}>
        Ne pas valider
      </Button>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
        title={
          mode === 'transfer'
            ? 'Transférer à un gestionnaire de réseau'
            : mode === 'archive'
              ? 'Archiver la demande'
              : 'Ne pas valider la demande'
        }
      >
        {mode === 'choice' ? (
          <div className="flex flex-col items-start gap-4">
            <Button priority="secondary" onClick={() => setMode('transfer')}>
              Transférer à un gestionnaire de réseau
            </Button>
            <Button priority="secondary" onClick={() => setMode('archive')}>
              Archiver la demande
            </Button>
          </div>
        ) : mode === 'archive' ? (
          <CcrtArchiveForm demandId={demand.id} onClose={() => setMode(null)} />
        ) : mode === 'transfer' ? (
          <CcrtTransferForm demandId={demand.id} onClose={() => setMode(null)} />
        ) : null}
      </Dialog>
    </div>
  );
}
