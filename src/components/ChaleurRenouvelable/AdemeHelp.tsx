'use client';

import { useState } from 'react';

import { espaceExterieurValues, useChoixChauffageQueryParams } from '@/components/choix-chauffage/useChoixChauffageQueryParams';
import useForm from '@/components/form/react-form/useForm';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import type { EspaceExterieur } from '@/modules/app/types';
import { fieldLabelInformation, zContactFormAdemeHelp } from '@/modules/demands/constants';
import { notify } from '@/modules/notification';
import { submitToAirtable } from '@/services/airtable';
import { Airtable } from '@/types/enum/Airtable';
import { pick } from '@/utils/objects';

export default function AdemeHelp({ className }: { className?: string }) {
  const { userInfo, setUserInfo } = useUserInfo();
  const [isLoading, setIsLoading] = useState(false);
  const urlParams = useChoixChauffageQueryParams();
  const { Form, Field, Submit } = useForm({
    defaultValues: {
      email: userInfo.email ?? '',
      phone: userInfo.phone ?? '',
      termOfUse: false,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setUserInfo(pick(value, ['email', 'phone', 'termOfUse']));
      const espaceExterieur: EspaceExterieur = espaceExterieurValues.includes(urlParams.espaceExterieur as EspaceExterieur)
        ? (urlParams.espaceExterieur as EspaceExterieur)
        : 'none';
      submitToAirtable(
        {
          Adresse: urlParams.adresse,
          Email: value.email,
          'Espace extérieur': espaceExterieur,
          'Mode de chauffage': urlParams.typeLogement,
          'Nombre de logement': urlParams.nbLogements,
          Telephone: value.phone,
        },
        Airtable.CONTACT_CHALEUR_RENOUVELABLE
      )
        .then(() => setIsLoading(false))
        .catch((error) => {
          notify('error', error.message);
          setIsLoading(false);
        });
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
            <Field.EmailInput name="email" label={fieldLabelInformation.email} className="flex-1 [&_input]:bg-white" />
            <Field.PhoneInput name="phone" label={fieldLabelInformation.phone} className="flex-1 [&_input]:bg-white" />
          </div>
          <Field.Checkbox
            name="termOfUse"
            label={
              <>
                J’accepte les&nbsp;<Link href="/cgu">conditions générales d’utilisation du service</Link>.
              </>
            }
          />
          <Submit disabled={false} loading={isLoading}>
            Envoyer
          </Submit>
        </Form>
      </CallOut>
    </div>
  );
}
