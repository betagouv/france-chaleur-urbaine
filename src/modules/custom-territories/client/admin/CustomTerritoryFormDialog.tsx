import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import type { CreateCustomTerritoryInput } from '../../constants';
import type { CustomTerritory } from '../../types';
import CustomTerritoryForm from '../CustomTerritoryForm';

type CustomTerritoryFormDialogProps = {
  control: DialogControl<Pick<CustomTerritory, 'id' | 'name' | 'recipe'> | undefined>;
};

/** Standalone create / edit dialog of a custom territory (owns its mutations and cache invalidation). */
function CustomTerritoryFormDialog({ control }: CustomTerritoryFormDialogProps) {
  const utils = trpc.useUtils();
  const createTerritory = trpc.customTerritories.admin.create.useMutation();
  const updateTerritory = trpc.customTerritories.admin.update.useMutation();
  const editing = control.data; // undefined = creation

  // Awaited so a failed mutation rejects the form submit: `<Form>` reports it and the dialog stays open.
  const handleSubmit = async (input: CreateCustomTerritoryInput) => {
    if (editing) {
      await updateTerritory.mutateAsync({ ...input, id: editing.id });
    } else {
      await createTerritory.mutateAsync(input);
    }
    notify('success', editing ? 'Territoire mis à jour, demandes recalculées' : 'Territoire créé, demandes recalculées');
    await Promise.all([utils.customTerritories.admin.list.invalidate(), utils.permissions.invalidate()]);
    control.close();
  };

  return (
    <Dialog {...control.dialogProps} size="lg" title={editing ? 'Modifier le territoire personnalisé' : 'Créer un territoire personnalisé'}>
      <CustomTerritoryForm territory={editing} onSubmit={handleSubmit} />
    </Dialog>
  );
}

export default CustomTerritoryFormDialog;
