import useForm from '@/components/form/react-form/useForm';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalSimple';
import { usePut } from '@/hooks/useApi';
import { notify, toastErrors } from '@/services/notification';

import { type RenameProEligibilityTestRequest, zRenameProEligibilityTestRequest } from '../constants';

type RenameEligibilityTestFormProps = {
  testId: string;
  currentName: string;
};

const RenameEligibilityTestForm = ({ testId, currentName }: RenameEligibilityTestFormProps) => {
  const { closeModal } = useModal();
  const { mutateAsync: renameTest } = usePut<RenameProEligibilityTestRequest>(`/api/pro-eligibility-tests/${testId}`, {
    invalidate: ['/api/pro-eligibility-tests'],
    onSuccess: () => {
      notify('success', 'Le test a été renommé avec succès');
    },
  });

  const { Form, Input, Submit } = useForm({
    defaultValues: {
      name: currentName,
    },
    schema: zRenameProEligibilityTestRequest,
    onSubmit: toastErrors(
      async ({ value }: { value: RenameProEligibilityTestRequest }) => {
        await renameTest(testId, {
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
