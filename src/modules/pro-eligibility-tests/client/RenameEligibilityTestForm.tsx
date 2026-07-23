import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify, toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { zRenameProEligibilityTestRequest } from '../constants';

type RenameEligibilityTestFormProps = {
  testId: string;
  currentName: string;
};

const RenameEligibilityTestForm = ({ testId, currentName }: RenameEligibilityTestFormProps) => {
  const { closeModal } = useModal();
  const utils = trpc.useUtils();

  const { mutateAsync: renameTest } = trpc.proEligibilityTests.rename.useMutation({
    onSuccess: (updatedTest) => {
      notify('success', 'Le test a été renommé avec succès');

      // Update the get cache if it exists for this test
      utils.proEligibilityTests.get.setData({ id: testId }, (oldData) => {
        if (oldData) {
          return { ...oldData, name: updatedTest.name };
        }
        return oldData;
      });

      // Update the list cache to reflect the renamed test
      utils.proEligibilityTests.list.setData(undefined, (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            items: oldData.items.map((item) => (item.id === testId ? { ...item, name: updatedTest.name } : item)),
          };
        }
        return oldData;
      });
    },
  });

  const form = useAppForm({
    ...schemaValidation(zRenameProEligibilityTestRequest),
    defaultValues: {
      name: currentName,
    },
    onSubmit: toastErrors(
      async ({ value }) => {
        await renameTest({
          id: testId,
          name: value.name,
        });
        closeModal();
      },
      (err) => `Une erreur est survenue lors du renommage du test: ${err.message}`
    ),
  });

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <form.AppField name="name">{(field) => <field.TextField label="Nom du test" />}</form.AppField>

        <div className="flex justify-end gap-2 mt-4">
          <Button priority="secondary" onClick={closeModal}>
            Annuler
          </Button>
          <form.SubmitButton>Renommer</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
};

export default RenameEligibilityTestForm;
