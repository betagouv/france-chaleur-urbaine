import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import useForm from '@/components/form/react-form/useForm';
import { AnalyticsFormId } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import { type ContactFormInfos, zContactFormCreateDemandInput } from '@/modules/demands/constants';
import { pick } from '@/utils/objects';

import DemandContactFields from './DemandContactFields';

type ContactFormProps = {
  onSubmit: (values: ContactFormInfos) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
};

export const ContactForm = ({ onSubmit, isLoading, cardMode, city, heatingTypeInput }: ContactFormProps) => {
  const router = useRouter();
  const { userInfo, setUserInfo } = useUserInfo();

  const getDefaultStructure = () => {
    switch (router.pathname) {
      case '/coproprietaire':
        return 'Copropriété';
      case '/tertiaire':
        return 'Tertiaire';
      default:
        return '';
    }
  };

  const initialValues = {
    company: userInfo.company ?? '',
    companyType: userInfo.companyType ?? '',
    demandArea: undefined as unknown as number,
    demandCompanyName: userInfo.demandCompanyName ?? '',
    demandCompanyType: userInfo.demandCompanyType ?? '',
    email: userInfo.email ?? '',
    firstName: userInfo.firstName ?? '',
    heatingEnergy: userInfo.heatingEnergy ?? '',
    lastName: userInfo.lastName ?? '',
    nbLogements: undefined as unknown as number,
    phone: userInfo.phone ?? '',
    structure: userInfo.structure ?? getDefaultStructure(),
    termOfUse: false,
  };
  const { form, Form, Field, Fieldset, FieldsetLegend, FieldWrapper, Submit, useValue } = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setUserInfo(
        pick(value, [
          'company',
          'companyType',
          'demandCompanyName',
          'demandCompanyType',
          'email',
          'firstName',
          'heatingEnergy',
          'lastName',
          'phone',
          'structure',
        ])
      );
      onSubmit(value);
    },
    schema: zContactFormCreateDemandInput,
  });
  const structure = useValue('structure') as string | undefined;
  const companyType = useValue('companyType') as string | undefined;
  const demandCompanyType = useValue('demandCompanyType') as string | undefined;
  const contactState = { companyType, demandCompanyType, structure };
  const formUi = { Field, Fieldset, FieldsetLegend, FieldWrapper, form };

  return (
    <Form id={AnalyticsFormId.form_contact}>
      <DemandContactFields
        cardMode={cardMode}
        city={city}
        contactState={contactState}
        formUi={formUi}
        heatingTypeInput={heatingTypeInput}
        showHeatingEnergy
        showHouseWarning
      />
      <FieldWrapper>
        <Field.Checkbox name="termOfUse" label="J’accepte les conditions générales d’utilisation du service." />
      </FieldWrapper>
      <Submit disabled={false} loading={isLoading}>
        Envoyer
      </Submit>
    </Form>
  );
};

export default ContactForm;
