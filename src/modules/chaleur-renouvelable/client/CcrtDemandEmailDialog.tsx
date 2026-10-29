import { useEffect, useRef, useState } from 'react';

import Accordion from '@/components/ui/Accordion';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import type { CcrtDemand } from '../types';
import { CcrtDemandEmailForm } from './CcrtDemandEmailForm';

type CcrtDemandEmailDialogProps = {
  demand: CcrtDemand;
  onClose: () => void;
  showHistory?: boolean;
  initialEmailId?: string;
  onPhoneContact: () => void;
};

/**
 * Displays the Figma contact dialog and the shared sent-message history below its form.
 */
export function CcrtDemandEmailDialog({
  demand,
  onClose,
  showHistory = false,
  initialEmailId,
  onPhoneContact,
}: CcrtDemandEmailDialogProps) {
  const [activePanel, setActivePanel] = useState<string | null>(showHistory ? 'history' : 'message');
  const historyRef = useRef<HTMLDivElement>(null);
  const preferences = trpc.users.getPreferences.useQuery();
  const followUp = trpc.batEnr.ccrt.getFollowUp.useQuery({ demandId: demand.id });

  // Wait for loaded content and the dialog's initial autofocus before positioning the history.
  useEffect(() => {
    if (!showHistory || preferences.isLoading || followUp.isLoading) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      historyRef.current?.querySelector('button')?.focus({ preventScroll: true });
      historyRef.current?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [showHistory, preferences.isLoading, followUp.isLoading]);

  return (
    <Dialog
      title={
        <>
          <Icon name="fr-icon-mail-fill" size="lg" /> Contacter {demand.first_name} {demand.last_name}
          {demand.phone && (
            <p className="my-2 font-normal">
              OU par téléphone au{' '}
              <a className="text-blue" href={`tel:${demand.phone}`} onClick={onPhoneContact}>
                {demand.phone}
              </a>
            </p>
          )}
        </>
      }
      size="lg"
      className="max-w-[960px]! [&_.fr-modal__title]:mb-0"
      open
      onOpenChange={(open) => !open && onClose()}
    >
      {preferences.isError ? (
        <p role="alert">Impossible de charger les préférences d’envoi.</p>
      ) : preferences.data ? (
        <CcrtDemandEmailForm demand={demand} onClose={onClose} preferences={preferences.data} isActive={activePanel === 'message'} />
      ) : (
        <p role="status">Chargement des e-mails</p>
      )}
      <div ref={historyRef} className="mt-4">
        <Accordion
          label={`Historique des messages (${followUp.data?.emails.length ?? 0})`}
          expanded={activePanel === 'history'}
          onExpandedChange={(expanded) => setActivePanel(expanded ? 'history' : null)}
        >
          {followUp.isError ? (
            <p role="alert">Impossible de charger les messages.</p>
          ) : followUp.isLoading ? (
            <p role="status">Chargement des messages…</p>
          ) : followUp.data?.emails.length ? (
            followUp.data.emails.map((email) => (
              <Accordion
                key={email.id}
                label={`Le ${dayjs(email.sent_at).format('D MMMM YYYY')} — Objet : ${email.object}`}
                defaultExpanded={email.id === initialEmailId}
              >
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
      </div>
    </Dialog>
  );
}
