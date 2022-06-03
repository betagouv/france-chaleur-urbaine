import { useFormspark } from '@formspark/use-formspark';
import { formatDataToFormspark } from '@helpers';

const FORMSPARK_FORM_ID = process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID || '';

const useBackEndFCU = (): [(arg: any) => void, boolean] => {
  const [submitToFormspark, submittingToFormspark] = useFormspark({
    formId: FORMSPARK_FORM_ID,
  });
  const submit = (values: any) => {
    const response = Promise.all([
      submitToFormspark(formatDataToFormspark(values)),
    ]);
    return response;
  };

  return [submit, submittingToFormspark];
};

export default useBackEndFCU;
