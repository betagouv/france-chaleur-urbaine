import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import { notify } from '@/modules/notification';
import type { OrganizationRef } from '@/modules/organizations/types';
import trpc from '@/modules/trpc/client';

import OrganizationForm from '../OrganizationForm';

/** Dialog autonome de création / édition d'une organisation (gère ses mutations + invalidation). */
const OrganizationFormDialog = ({ control }: { control: DialogControl<OrganizationRef | undefined> }) => {
  const utils = trpc.useUtils();
  const createOrganization = trpc.organizations.admin.create.useMutation();
  const updateOrganization = trpc.organizations.admin.update.useMutation();
  const editing = control.data; // undefined = création

  // `mutate` (pas `mutateAsync`) : aucune promesse à try/catcher. L'erreur est notifiée globalement
  // (errorHandlerLink) ; `onSuccess` ne s'exécute qu'en cas de succès → le dialog ne se ferme que là.
  const handleSubmit = ({ name }: { name: string }) => {
    const onSuccess = async () => {
      notify('success', editing ? 'Organisation mise à jour' : 'Organisation créée');
      await utils.organizations.admin.list.invalidate();
      control.close();
    };
    if (editing) {
      updateOrganization.mutate({ id: editing.id, name }, { onSuccess });
    } else {
      createOrganization.mutate({ name }, { onSuccess });
    }
  };

  return (
    <Dialog {...control.dialogProps} title={editing ? "Modifier l'organisation" : 'Créer une organisation'}>
      <OrganizationForm
        organization={editing}
        loading={createOrganization.isPending || updateOrganization.isPending}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
};

export default OrganizationFormDialog;
