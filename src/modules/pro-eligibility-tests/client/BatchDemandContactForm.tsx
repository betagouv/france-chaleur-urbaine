import { ContactForm } from '@/components/EligibilityForm/components/ContactForm';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import type { ContactFormInfos } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';

interface BatchDemandContactFormProps {
  addressIds: string[];
  onSubmit: () => void;
}

/**
 * Formulaire pour créer plusieurs demandes en batch à partir d'adresses testées
 */
export const BatchDemandContactForm = ({ addressIds }: BatchDemandContactFormProps) => {
  const { mutateAsync, isPending, isSuccess, isError } = trpc.demands.user.createBatch.useMutation({});

  const submitContactForm = async (contactFormInfos: ContactFormInfos) => {
    await mutateAsync({ addressIds, contactInfo: contactFormInfos });
  };

  if (isSuccess) {
    return (
      <CallOut variant="success" className="mt-4">
        <p className="fr-text--lg fr-text--bold">
          {addressIds.length === 1
            ? 'Votre demande de contact est bien prise en compte.'
            : `Vos ${addressIds.length} demandes de contact sont bien prises en compte.`}
        </p>
        <div className="mt-4">
          <Link href="/pro/mes-demandes">Voir mes demandes</Link>
        </div>
      </CallOut>
    );
  }

  return (
    <>
      <Heading size="h4">
        Informations de contact partagées pour {addressIds.length === 1 ? 'cette adresse' : `ces ${addressIds.length} adresses`}
      </Heading>
      <p className="text-sm text-faded my-0.5">Les mêmes informations de contact seront utilisées pour toutes les demandes créées.</p>

      <ContactForm onSubmit={submitContactForm} isLoading={isPending} />
      {isError && (
        <div className="text-error">
          Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
        </div>
      )}
    </>
  );
};
