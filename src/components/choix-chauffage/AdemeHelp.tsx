'use client';

import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { useState } from 'react';

import { espaceExterieurValues, useChoixChauffageQueryParams } from '@/components/choix-chauffage/useChoixChauffageQueryParams';
import useForm from '@/components/form/react-form/useForm';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import type { EspaceExterieur } from '@/modules/app/types';
import { fieldLabelInformation, zContactFormAdemeHelp } from '@/modules/demands/constants';
import { notify } from '@/modules/notification';
import { submitToAirtable } from '@/services/airtable';
import { Airtable } from '@/types/enum/Airtable';

export default function AdemeHelp({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const urlParams = useChoixChauffageQueryParams();
  const espaceExterieurLabel = {
    both: 'Partagés et individuels',
    none: 'Aucun',
    private: 'Individuels uniquement',
    shared: 'Partagés uniquement',
  } satisfies Record<EspaceExterieur, string>;
  const { Form, Field, Submit } = useForm({
    defaultValues: {
      email: '',
      phone: '',
      termOfUse: false,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      const espaceExterieur: EspaceExterieur = espaceExterieurValues.includes(urlParams.espaceExterieur as EspaceExterieur)
        ? (urlParams.espaceExterieur as EspaceExterieur)
        : 'none';
      submitToAirtable(
        {
          Adresse: urlParams.adresse,
          DPE: urlParams.dpe,
          Email: value.email,
          'Espace extérieur': espaceExterieurLabel[espaceExterieur],
          'Mode de chauffage': urlParams.typeLogement,
          'Nb habitant moyen': urlParams.habitantsMoyen,
          'Nombre de logement': urlParams.nbLogements,
          'Surface moyenne': urlParams.surfaceMoyenne,
          Telephone: value.phone,
        },
        Airtable.CONTACT_CHALEUR_RENOUVELABLE
      )
        .then(() => {
          setIsLoading(false);
          setIsSent(true);
        })
        .catch((error: Error) => {
          notify('error', error.message);
          setIsLoading(false);
        });
    },
    schema: zContactFormAdemeHelp,
  });

  return (
    <>
      <h3>Et maintenant ?</h3>
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
            {true && (
              <div className="fr-mt-3w">
                <Alert severity="success" title="Merci pour votre attention" description="Nous reviendrons rapidement vers vous." />
              </div>
            )}
          </Form>
        </CallOut>
      </div>
    </>
  );
}
