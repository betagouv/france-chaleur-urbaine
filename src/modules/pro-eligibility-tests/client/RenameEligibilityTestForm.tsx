import useForm from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import trpc from '@/modules/trpc/client';
import { notify, toastErrors } from '@/services/notification';

import { type RenameProEligibilityTestRequest, zRenameProEligibilityTestRequest } from '../constants';

type RenameEligibilityTestFormProps = {
  testId: string;
  currentName: string;
};

const RenameEligibilityTestForm = ({ testId, currentName }: RenameEligibilityTestFormProps) => {
  const { closeModal } = useModal();
  const utils = trpc.useUtils();

  const { mutateAsync: renameTest } = trpc.proEligibilityTests.update.useMutation({
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

  const { Form, Input, Submit } = useForm({
    defaultValues: {
      name: currentName,
    },
    schema: zRenameProEligibilityTestRequest,
    onSubmit: toastErrors(
      async ({ value }: { value: RenameProEligibilityTestRequest }) => {
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
    <Form>
      <div className="flex flex-col gap-4">
        <Input name="name" label="Nom du test" />

        <div className="flex justify-end gap-2 mt-4">
          <Button priority="secondary" onClick={closeModal}>
            Annuler
          </Button>
          <Submit>Renommer</Submit>
        </div>
      </div>
    </Form>
  );
};

export default RenameEligibilityTestForm;
