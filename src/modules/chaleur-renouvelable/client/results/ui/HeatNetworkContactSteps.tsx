import type { ContactRecipientId } from '@/modules/chaleur-renouvelable/client/DemandFCRForm';
import cx from '@/utils/cx';

export function HeatNetworkContactSteps({ onSelectRecipient }: { onSelectRecipient: (recipientId: ContactRecipientId) => void }) {
  const handleSelectRecipient = (recipientId: ContactRecipientId) => {
    onSelectRecipient(recipientId);
  };

  return (
    <section aria-label="Étapes de prise de contact" className="mt-6 grid border border-(--border-default-grey) md:grid-cols-2 gap-3">
      <ContactStep
        description="C’est lui qui détermine la faisabilité technique et le coût exact du raccordement."
        number={1}
        title="Contactez d’abord le gestionnaire de réseau"
        actionLabel="Être contacté·e par le gestionnaire"
        onClick={() => handleSelectRecipient('network-manager')}
        isPrimary
      />
      <ContactStep
        description="Si le raccordement n’est finalement pas possible, un·e conseiller·e du service public vous aide à choisir parmi les autres solutions ci-dessous."
        number={2}
        title="Refus ou réponse négative ?"
        actionLabel="Être contacté·e par un conseiller"
        onClick={() => handleSelectRecipient('public-advisor')}
      />
    </section>
  );
}

type ContactStepProps = {
  actionLabel: string;
  description: string;
  isPrimary?: boolean;
  number: number;
  onClick: () => void;
  title: string;
};

function ContactStep({ actionLabel, description, isPrimary = false, number, onClick, title }: ContactStepProps) {
  return (
    <div className={isPrimary ? 'border-2 border-blue bg-(--background-action-low-blue-france) p-4 md:p-5' : 'p-4 md:p-5'}>
      <div className="flex items-start gap-3">
        <span
          className={
            isPrimary
              ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full pt-0.5 bg-blue text-sm font-bold text-white'
              : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full pt-0.5 border border-blue text-sm font-bold text-blue'
          }
          aria-hidden="true"
        >
          {number}
        </span>
        <div>
          <h4 className="mb-1 text-base text-blue">{title}</h4>
          <div className="flex items-center gap-3">
            <p className={cx('mb-4', isPrimary && 'text-blue')}>{description}</p>
            {isPrimary && <span className="fr-icon-arrow-right-line text-blue mb-4 hidden shrink-0 md:inline-block" aria-hidden="true" />}
          </div>
          <button type="button" className="text-blue underline" onClick={onClick}>
            {actionLabel}
            <span className="fr-icon-arrow-down-line ml-2" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
