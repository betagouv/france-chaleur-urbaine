import Accordion from '@/components/ui/Accordion';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import type { CcrtDemand } from '../types';
import { CcrtDemandEmailForm } from './CcrtDemandEmailForm';

type CcrtDemandEmailDialogProps = { demand: CcrtDemand; onClose: () => void; showHistory?: boolean; onPhoneContact: () => void };

/**
 * Displays the Figma contact dialog and the shared sent-message history below its form.
 */
export function CcrtDemandEmailDialog({ demand, onClose, showHistory = false, onPhoneContact }: CcrtDemandEmailDialogProps) {
  const preferences = trpc.users.getPreferences.useQuery();
  const followUp = trpc.batEnr.ccrt.getFollowUp.useQuery({ demandId: demand.id });
  return (
    <Dialog
      title={
        <>
          <Icon name="fr-icon-mail-fill" size="lg" /> Contacter {demand.first_name} {demand.last_name}
        </>
      }
      size="lg"
      className="max-w-[960px]!"
      open
      onOpenChange={(open) => !open && onClose()}
    >
      {demand.phone && (
        <p className="mb-6">
          OU par téléphone au{' '}
          <a className="bg-none no-underline shadow-none" href={`tel:${demand.phone}`} onClick={onPhoneContact}>
            {demand.phone}
          </a>
        </p>
      )}
      {preferences.isError ? (
        <p role="alert">Impossible de charger les préférences d’envoi.</p>
      ) : preferences.data ? (
        <CcrtDemandEmailForm demand={demand} onClose={onClose} preferences={preferences.data} />
      ) : (
        <p role="status">Chargement des préférences d’envoi…</p>
      )}
      <Accordion label={`Historique des messages (${followUp.data?.emails.length ?? 0})`} defaultExpanded={showHistory} className="mt-8">
        {followUp.isError ? (
          <p role="alert">Impossible de charger les messages.</p>
        ) : followUp.isLoading ? (
          <p role="status">Chargement des messages…</p>
        ) : followUp.data?.emails.length ? (
          followUp.data.emails.map((email) => (
            <Accordion key={email.id} label={`Le ${dayjs(email.sent_at).format('D MMMM YYYY')} — Objet : ${email.object}`}>
              <p className="mb-2">À : {email.to}</p>
              {email.cc && <p className="mb-2">Copie à : {email.cc}</p>}
              <p className="mb-4">De : {email.reply_to}</p>
              <p className="whitespace-pre-wrap">{email.body}</p>
              <p className="mb-0 whitespace-pre-wrap">{email.signature}</p>
            </Accordion>
          ))
        ) : (
          <p>Aucun message envoyé.</p>
        )}
      </Accordion>
    </Dialog>
  );
}
