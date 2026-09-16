import { useState } from 'react';

import Alert from '@/components/ui/Alert';
import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { getEmailBlockReasonLabel } from '@/modules/email/constants';
import { notify, toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { formatFrenchDateTime } from '@/utils/date';

import EmailEventsList from './EmailEventsList';

type EmailDeliverabilityPanelProps = {
  email: string;
  /** Loads the Brevo events immediately instead of behind a button (inventory page, where the detail is the point). */
  autoLoadEvents?: boolean;
};

/**
 * Admin view of the Brevo deliverability of an address: blocked or not (mirrored blocklist), reason,
 * unblock action and the live event history. Used in the user dialog, the demand email modal and the inventory page.
 */
function EmailDeliverabilityPanel({ email, autoLoadEvents = false }: EmailDeliverabilityPanelProps) {
  const utils = trpc.useUtils();
  const [showEvents, setShowEvents] = useState(autoLoadEvents);
  const { data, isLoading } = trpc.email.deliverability.getEmailDeliverability.useQuery({ email });
  // Live Brevo call: only on demand, so opening a dialog never waits for (or fails on) the Brevo API.
  const { data: eventsData, isLoading: isLoadingEvents } = trpc.email.deliverability.listEmailEvents.useQuery(
    { email },
    { enabled: showEvents }
  );
  const unblockContact = trpc.email.deliverability.unblockContact.useMutation();

  const handleUnblock = toastErrors(async () => {
    const result = await unblockContact.mutateAsync({ email });
    notify('success', result.wasBlocked ? 'Réception des emails réactivée' : "L'adresse n'était plus bloquée côté Brevo");
    await utils.email.deliverability.invalidate();
  });

  if (isLoading || !data) {
    return <Loader variant="section" />;
  }

  if (!data.configured) {
    return (
      <Notice variant="info" size="sm">
        Suivi de délivrabilité non configuré sur cet environnement (clé API Brevo absente).
      </Notice>
    );
  }

  const lastSyncLabel = data.lastSyncAt
    ? `dernière synchronisation le ${formatFrenchDateTime(new Date(data.lastSyncAt))}`
    : 'aucune synchronisation connue';

  return (
    <div className="flex flex-col gap-4">
      {data.blocked ? (
        <Alert variant="error" size="sm" title="Emails bloqués côté Brevo">
          <p className="m-0">
            Depuis le <strong>{formatFrenchDateTime(new Date(data.blocked.blocked_at))}</strong> :{' '}
            <strong>{getEmailBlockReasonLabel(data.blocked.reason_code)}</strong>
          </p>
          <p className="m-0 mt-1 text-xs text-faded">Plus aucun email ne lui est envoyé tant que le blocage est actif ({lastSyncLabel}).</p>
          <div className="mt-2">
            <AsyncButton
              size="small"
              priority="secondary"
              iconId="fr-icon-lock-unlock-line"
              onClick={handleUnblock}
              disabled={!data.writesEnabled}
              title={data.writesEnabled ? undefined : 'Déblocage désactivé sur cette instance'}
            >
              Réactiver la réception des emails
            </AsyncButton>
          </div>
        </Alert>
      ) : (
        <Notice variant="info" size="sm">
          Aucun blocage connu côté Brevo ({lastSyncLabel}).
        </Notice>
      )}
      {showEvents ? (
        <div>
          <div className="text-sm font-bold mb-1">Événements Brevo (90 derniers jours)</div>
          {isLoadingEvents || !eventsData ? (
            <Loader size="sm" />
          ) : (
            <EmailEventsList events={eventsData.events} errorMessage={eventsData.error} />
          )}
        </div>
      ) : (
        <div>
          <Button size="small" priority="tertiary" iconId="ri-history-line" onClick={() => setShowEvents(true)}>
            Voir les événements Brevo
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmailDeliverabilityPanel;
