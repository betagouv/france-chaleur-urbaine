'use client';

import { useState } from 'react';
import styled from 'styled-components';

import DSFRInput from '@/components/form/dsfr/Input';
import useForm from '@/components/form/react-form/useForm';
import CallOut from '@/components/ui/CallOut';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import { fieldLabelInformation, zContactFormAdemeHelp } from '@/modules/demands/constants';
import { pick } from '@/utils/objects';

type AdemeHelpProps = {
  className?: string;
  onSubmitSuccess?: (value: { email: string; phone?: string; termOfUse: boolean }) => void;
};

export const Input = styled(DSFRInput)`
  input {
    background: white;
  }
`;

export default function AdemeHelp({ className, onSubmitSuccess }: AdemeHelpProps) {
  const { userInfo, setUserInfo } = useUserInfo();
  const [isLoading, setIsLoading] = useState(false);

  const { Form, Field, Submit } = useForm({
    defaultValues: {
      email: userInfo.email ?? '',
      phone: userInfo.phone ?? '',
      termOfUse: false,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setUserInfo(pick(value, ['email', 'phone']));
      // TODO: appel API / TRPC
      console.log('submit value', value);
      onSubmitSuccess?.(value);
      setIsLoading(false);
    },
    schema: zContactFormAdemeHelp,
  });

  return (
    <div className={className} id="help-ademe">
      <CallOut title="Bénéficiez d’un accompagnement personnalisé par l’Ademe" size="lg" colorVariant="yellow-moutarde">
        <p className="fr-callout__text fr-mb-3w">
          Une experte de l'ADEME vous accompagnera personnellement dans votre projet de remplacement de chauffage par une solution
          écologique : faisabilité de votre projet, coûts à prévoir, différentes étapes à suivre...
        </p>
        <Form>
          <div className="full flex flex-col md:flex-row md:gap-5 fr-mb-3w md:mb-0">
            <Input
              label={fieldLabelInformation.email}
              nativeInputProps={{
                required: true,
                type: 'email',
              }}
              className="flex-1"
            />
            <Input
              label={fieldLabelInformation.phone}
              nativeInputProps={{
                required: false,
                type: 'phone',
              }}
              className="flex-1"
            />
          </div>
          <Field.Checkbox name="termOfUse" label="J’accepte les conditions générales d’utilisation du service." />
          <Submit disabled={false} loading={isLoading}>
            Envoyer
          </Submit>
        </Form>
      </CallOut>
    </div>
  );
}
