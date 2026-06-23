import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import type { OrganizationRef } from '@/modules/organizations/types';

import OrganizationNetworks from '../OrganizationNetworks';

/** Dialog autonome listant/éditant les réseaux rattachés à une organisation. */
const OrganizationNetworksDialog = ({ control }: { control: DialogControl<OrganizationRef> }) => (
  <Dialog {...control.dialogProps} title={`Réseaux — ${control.data?.name ?? ''}`}>
    {control.isOpen && control.data && (
      <div className="space-y-3">
        <p className="text-sm text-faded">
          Rattacher des réseaux à cette organisation permet à des utilisateurs avec une permissions organisation d'accéder aux demandes pour
          tous les réseaux de cette organisation.
        </p>
        <p className="text-sm text-faded">
          Cela permet également de fournir au gestionnaire un jeton d'accès à l'API pour récupérer et mettre à jour les demandes de cette
          organisation.
        </p>
        <OrganizationNetworks organizationId={control.data.id} />
      </div>
    )}
  </Dialog>
);

export default OrganizationNetworksDialog;
