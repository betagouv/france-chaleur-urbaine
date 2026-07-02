import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import type { OrganizationRef } from '@/modules/organizations/types';

import OrganizationCredentials from '../OrganizationCredentials';

/** Dialog autonome listant les tokens API d'une organisation. */
const OrganizationCredentialsDialog = ({ control }: { control: DialogControl<OrganizationRef> }) => (
  <Dialog {...control.dialogProps} title={`Tokens API — ${control.data?.name ?? ''}`}>
    {control.isOpen && control.data && <OrganizationCredentials organizationId={control.data.id} />}
  </Dialog>
);

export default OrganizationCredentialsDialog;
