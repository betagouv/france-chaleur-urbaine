import { useMemo, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import EmailDeliverabilityPanel from '@/modules/email/client/EmailDeliverabilityPanel';
import EmailUnblockButton from '@/modules/email/client/EmailUnblockButton';
import { getEmailBlockReasonLabel } from '@/modules/email/constants';
import { notify, toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { formatFrenchDateTime } from '@/utils/date';

type BlockedContact = RouterOutput['email']['deliverability']['listBlockedContacts'][number];

/**
 * Admin inventory of the addresses blocked by Brevo for transactional emails: reason, date, linked account
 * and demands, manual sync and per-address detail / unblock.
 */
const EmailDeliverabilityPage = () => {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: blockedContacts, isLoading } = trpc.email.deliverability.listBlockedContacts.useQuery();
  const syncBlockedContacts = trpc.email.deliverability.syncBlockedContacts.useMutation();

  // ISO strings compare chronologically, so the max is the latest sync.
  const lastSyncAt = useMemo(
    () =>
      blockedContacts?.reduce<string | null>(
        (latest, contact) => (latest && latest > contact.synced_at ? latest : contact.synced_at),
        null
      ),
    [blockedContacts]
  );

  const handleSync = toastErrors(async () => {
    const result = await syncBlockedContacts.mutateAsync();
    notify(
      result.skipped ? 'error' : 'success',
      result.skipped
        ? 'Synchronisation impossible : clé API Brevo non configurée'
        : `Synchronisation terminée : ${result.total} bloqué(s), ${result.added} nouveau(x), ${result.removed} débloqué(s)`
    );
    await utils.email.deliverability.invalidate();
  });

  const columns: ColumnDef<BlockedContact>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        cell: ({ row }) => (
          <Button size="small" priority="tertiary no outline" className="px-1!" onClick={() => setSelectedEmail(row.original.email)}>
            {row.original.email}
          </Button>
        ),
        header: 'Email',
        width: '380px',
      },
      {
        accessorFn: (row) => getEmailBlockReasonLabel(row.reason_code),
        filterType: 'Facets',
        header: 'Raison',
        id: 'reason',
      },
      {
        accessorKey: 'blocked_at',
        cellType: 'DateTime',
        filterType: 'Range',
        header: 'Bloqué le',
        width: '150px',
      },
      {
        accessorFn: (row) => (row.user_id ? 'Oui' : 'Non'),
        cell: ({ row }) =>
          row.original.user_id ? (
            <Link href={`/admin/users?userId=${row.original.user_id}`} isExternal>
              Voir le compte
            </Link>
          ) : (
            <span className="text-faded">Aucun</span>
          ),
        filterType: 'Facets',
        header: 'Compte FCU',
        id: 'user',
        width: '150px',
      },
      {
        accessorKey: 'demands_count',
        align: 'right',
        filterType: 'Range',
        header: 'Demandes',
        width: '160px',
      },
      {
        align: 'right',
        cell: ({ row }) => (
          <EmailUnblockButton
            email={row.original.email}
            reasonCode={row.original.reason_code}
            onUnblocked={() => utils.email.deliverability.listBlockedContacts.invalidate()}
          />
        ),
        enableSorting: false,
        header: '',
        id: 'actions',
        width: '60px',
      },
    ],
    [utils]
  );

  return (
    <SimplePage title="Délivrabilité des emails" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Délivrabilité des emails
      </Heading>
      <Text className="mb-4">
        Adresses pour lesquelles Brevo n'envoie plus nos emails (rejet définitif, désinscription, plainte). La liste est synchronisée
        automatiquement toutes les heures en journée. Cliquer sur une adresse affiche les événements Brevo et permet de la débloquer.
      </Text>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <AsyncButton size="small" priority="secondary" iconId="ri-refresh-line" onClick={handleSync}>
          Synchroniser maintenant
        </AsyncButton>
        <span className="text-sm text-faded">
          {lastSyncAt ? `Dernière synchronisation le ${formatFrenchDateTime(new Date(lastSyncAt))}` : 'Aucune synchronisation connue'}
        </span>
      </div>
      <TableSimple
        columns={columns}
        data={blockedContacts ?? []}
        loading={isLoading}
        enableGlobalFilter
        padding="sm"
        initialSortingState={[{ desc: true, id: 'blocked_at' }]}
        export={{ fileName: 'emails-bloques', sheetName: 'Emails bloqués' }}
      />
      <Dialog
        title={`Délivrabilité de ${selectedEmail}`}
        size="lg"
        open={!!selectedEmail}
        onOpenChange={(open) => !open && setSelectedEmail(null)}
      >
        {selectedEmail && <EmailDeliverabilityPanel email={selectedEmail} autoLoadEvents />}
      </Dialog>
    </SimplePage>
  );
};

export default EmailDeliverabilityPage;
