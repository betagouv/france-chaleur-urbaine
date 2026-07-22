import { useRouter } from 'next/router';
import type { z } from 'zod';

import { AnalyticsFormId } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import { type ContactFormInfos, fieldLabelInformation, zContactFormCreateDemandInput } from '@/modules/demands/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { pick } from '@/utils/objects';

import DemandContactFields, { demandContactRootFields } from './DemandContactFields';

type ContactFormProps = {
  onSubmit: (values: ContactFormInfos) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
};

/**
 * Demand creation contact form (eligibility funnel): shared contact fields,
 * heating energy and terms of use. Persists the contact info in the user info store.
 */
export const ContactForm = ({ onSubmit, isLoading, cardMode, city }: ContactFormProps) => {
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

  const defaultValues: z.input<typeof zContactFormCreateDemandInput> = {
    commentUser: '',
    company: userInfo.company ?? '',
    companyType: userInfo.companyType ?? '',
    demandArea: undefined,
    demandCompanyName: userInfo.demandCompanyName ?? '',
    demandCompanyType: userInfo.demandCompanyType ?? '',
    email: userInfo.email ?? '',
    firstName: userInfo.firstName ?? '',
    heatingEnergy: userInfo.heatingEnergy ?? '',
    lastName: userInfo.lastName ?? '',
    nbLogements: undefined,
    phone: userInfo.phone ?? '',
    structure: userInfo.structure ?? getDefaultStructure(),
    termOfUse: false,
  };

  const form = useAppForm({
    ...schemaValidation(zContactFormCreateDemandInput),
    defaultValues,
    onSubmit: async ({ value }) => {
      // re-parse to apply the schema defaults and get the output type
      const contactInfos = zContactFormCreateDemandInput.parse(value);
      setUserInfo(
        pick(contactInfos, [
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
      onSubmit(contactInfos);
    },
  });

  return (
    <Form form={form} id={AnalyticsFormId.form_contact}>
      <DemandContactFields form={form} fields={demandContactRootFields} cardMode={cardMode} city={city} showHouseWarning />
      <form.AppField name="heatingEnergy">
        {(field) => (
          <field.SelectField
            label={fieldLabelInformation.heatingEnergy.label}
            className="heatingEnergyContactInformations"
            options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
              label,
              value,
            }))}
          />
        )}
      </form.AppField>
      <form.AppField name="commentUser">
        {(field) => <field.TextareaField label={fieldLabelInformation.commentUser} nativeTextAreaProps={{ rows: 4 }} />}
      </form.AppField>
      <div className="fr-fieldset__element">
        <form.AppField name="termOfUse">
          {(field) => <field.CheckboxField label="J’accepte les conditions générales d’utilisation du service." />}
        </form.AppField>
      </div>
      <form.SubmitButton loading={isLoading}>Envoyer</form.SubmitButton>
    </Form>
  );
};

export default ContactForm;
