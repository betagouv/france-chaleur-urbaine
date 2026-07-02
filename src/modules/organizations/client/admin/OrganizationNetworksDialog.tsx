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
          Pour rattacher un utilisateur à cette organisation, ajoutez-lui la permission « Organisation » depuis sa fiche utilisateur.
        </p>
        <OrganizationNetworks organizationId={control.data.id} />
      </div>
    )}
  </Dialog>
);

export default OrganizationNetworksDialog;
