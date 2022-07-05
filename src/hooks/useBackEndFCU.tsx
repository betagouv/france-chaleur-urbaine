import { useFormspark } from '@formspark/use-formspark';
import {
  formatDataToAirtable,
  formatDataToFormspark,
  submitToAirtable,
} from '@helpers';

const FORMSPARK_FORM_ID = process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID || '';

const useBackEndFCU = (): [(arg: any) => void, boolean] => {
  const [submitToFormspark, submittingToFormspark] = useFormspark({
    formId: FORMSPARK_FORM_ID,
  });
  const submit = (values: any) => {
    if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION === 'true') {
      console.info(
        'Send following data to Formspark',
        formatDataToFormspark(values)
      );
      console.info(
        'Send following data to Airtabe',
        formatDataToAirtable(values)
      );
      return Promise.resolve([
        () => {
          //do nothing
        },
        true,
      ]);
    } else {
      return Promise.all([
        submitToFormspark(formatDataToFormspark(values)),
        submitToAirtable(formatDataToAirtable(values), 'FCU - Utilisateurs'),
      ]);
    }
  };

  return [submit, submittingToFormspark];
};

export default useBackEndFCU;
