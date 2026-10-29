import Alert from '@codegouvfr/react-dsfr/Alert';
import Badge from '@codegouvfr/react-dsfr/Badge';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '../constants';
import type { CcrtDemand, CcrtDemandUpdate } from '../types';
import { CcrtDemandAccess } from './CcrtDemandAccess';
import { CcrtDemandHistory } from './CcrtDemandHistory';
import { CcrtFollowUpForm } from './CcrtFollowUpForm';

type CcrtDemandFollowUpProps = {
  demand: CcrtDemand;
  isUpdating: boolean;
  onUpdate: (values: CcrtDemandUpdate) => Promise<void>;
  onContact: (showHistory?: boolean, emailId?: string) => void;
  onManageAccess?: () => void;
  showContactAction?: boolean;
};

/**
 * Contact action and existing status controls for a CCRT demand.
 */
export function CcrtDemandFollowUp({
  demand,
  isUpdating,
  onUpdate,
  onContact,
  onManageAccess,
  showContactAction = true,
}: CcrtDemandFollowUpProps) {
  const [offset, setOffset] = useState(0);
  const followUp = trpc.batEnr.ccrt.getFollowUp.useQuery({ demandId: demand.id, offset });
  const isToProcess = demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS;

  return (
    <aside className="border border-(--border-default-grey) bg-(--background-default-grey)">
      {showContactAction && (
        <div className={isToProcess ? 'bg-(--background-contrast-warning) p-4' : 'bg-(--background-contrast-info) p-4'}>
          <Badge severity={isToProcess ? 'warning' : 'info'} small className="mb-3">
            {isToProcess ? 'Action Attendue' : demand.status}
          </Badge>
          <h3 className="mb-2 text-lg">{isToProcess ? 'Contacter l’usager' : 'Relancer l’usager'}</h3>
          {isToProcess && <p className="mb-4 leading-6">Depuis {Math.max(0, dayjs().diff(demand.created_at, 'day'))} jours</p>}
          <Button full iconId="fr-icon-mail-line" iconPosition="right" onClick={() => onContact()}>
            Contacter par email
          </Button>
          {followUp.data && followUp.data.emails.length > 0 && (
            <div>
              <Button
                priority="tertiary no outline"
                size="small"
                iconId="fr-icon-mail-line"
                className="mt-2"
                onClick={() => onContact(true)}
              >
                Voir l’historique des messages
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="pt-2">
        <CcrtFollowUpForm key={demand.id} demand={demand} isUpdating={isUpdating} onUpdate={onUpdate} onSaved={() => setOffset(0)} />
      </div>
      {followUp.isError ? (
        <div className="p-4">
          <Alert severity="error" small description="Impossible de charger le suivi" />
          <Button size="small" priority="tertiary" onClick={() => void followUp.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : followUp.data ? (
        <>
          <CcrtDemandHistory
            followUp={followUp.data}
            offset={offset}
            onPageChange={setOffset}
            onEmailClick={(emailId) => onContact(true, emailId)}
          />
          <CcrtDemandAccess users={followUp.data.users} onManageAccess={onManageAccess} />
        </>
      ) : (
        <p className="p-4" role="status">
          Chargement du suivi…
        </p>
      )}
    </aside>
  );
}
