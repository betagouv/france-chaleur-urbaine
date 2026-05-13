import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { type ComponentType, useState } from 'react';

import useForm from '@/components/form/react-form/useForm';
import Link from '@/components/ui/Link';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  ESPACE_EXTERIEUR_VALUES,
  getEspaceExterieurOptionLabel,
  heatingEnergyOptions,
  occupantStatusOptions,
  type ProjectStatus,
  projectStatusOptions,
  zContactFormAdemeHelp,
} from '@/modules/chaleur-renouvelable/constants';
import trpc from '@/modules/trpc/client';
import { isDefined } from '@/utils/core';

export default function DemandFCRForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const trpcUtils = trpc.useUtils();
  const urlParams = useChoixChauffageQueryParams();
  const { Field, Form, Submit, useValue } = useForm<typeof zContactFormAdemeHelp>({
    defaultValues: {
      email: '',
      firstName: '',
      heatingEnergy: 'Électricité',
      lastName: '',
      occupantStatus: 'Copropriétaire',
      phone: '',
      projectStatus: [] as ProjectStatus[],
      termOfUse: false,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      const espaceExterieur =
        isDefined(urlParams.espaceExterieur) && ESPACE_EXTERIEUR_VALUES.includes(urlParams.espaceExterieur)
          ? urlParams.espaceExterieur
          : 'none';
      const typeLogement = urlParams.typeLogement ?? 'immeuble_chauffage_collectif';

      await trpcUtils.client.batEnr.addContactToAirtable.query({
        Adresse: urlParams.adresse ?? '',
        Date: new Date().toISOString(),
        DPE: urlParams.dpe,
        Email: value.email,
        'Espace extérieur': getEspaceExterieurOptionLabel(typeLogement, espaceExterieur),
        'Mode de chauffage': typeLogement,
        'Nb habitant moyen': Number(urlParams.habitantsMoyen || 2),
        Nom: value.lastName,
        'Nombre de logement': Number(urlParams.nbLogements || 25),
        'Où en êtes-vous de votre projet ?': value.projectStatus,
        Prénom: value.firstName,
        'Statut occupant': value.occupantStatus,
        'Surface moyenne': Number(urlParams.surfaceMoyenne || 70),
        Telephone: value.phone,
        'Url simulation': window.location.href,
        'Énergie de chauffage': value.heatingEnergy,
      });
      setIsLoading(false);
      setIsSent(true);
    },
    schema: zContactFormAdemeHelp,
  });
  const selectedProjectStatus = useValue<ProjectStatus[]>('projectStatus') ?? [];
  const SelectProjectStatus = Field.SelectCheckboxes as ComponentType<{
    className?: string;
    label: string;
    name: 'projectStatus';
    options: typeof projectStatusOptions;
    small?: boolean;
  }>;

  return (
    <section id="help-ademe" className="mt-6 rounded-sm bg-blue p-6 text-white">
      <h4 className="mb-4 text-xl font-bold text-white">Passez à l’étape suivante avec un·e conseiller·e du service public !</h4>
      <p className="mb-6 max-w-5xl ">
        Laissez vos coordonnées pour vous faire recontacter par un·e conseiller·e du service public et faire le point sur votre projet de
        remplacement de chauffage par une solution écologique : faisabilité, coûts à prévoir, étapes à suivre...
      </p>
      <Form>
        <div
          className={
            'grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 [&_.fr-label]:text-white [&_.fr-input]:bg-white [&_.fr-select]:bg-white [&_.fr-error-text]:text-white [&_.fr-messages-group]:text-white'
          }
        >
          <Field.Select name="occupantStatus" label="Vous êtes" options={occupantStatusOptions} />
          <Field.Select name="heatingEnergy" label="Énergie de chauffage" options={heatingEnergyOptions} />
          <Field.Input name="lastName" label="Nom" />
          <Field.Input name="firstName" label="Prénom" />
          <Field.EmailInput name="email" label="Email" />
          <Field.PhoneInput name="phone" label="Téléphone" />
          <div className="md:col-span-2">
            <SelectProjectStatus
              name="projectStatus"
              label="Où en êtes-vous de votre projet ? (optionnel)"
              options={projectStatusOptions}
              small
            />
            {selectedProjectStatus.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProjectStatus.map((status) => (
                  <span key={status} className="rounded-full bg-[#E3E3FD] px-2 py-1 text-xs font-medium text-blue">
                    {status}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Field.Checkbox
          name="termOfUse"
          className="mt-4 [&_.fr-label]:text-white [&_.fr-label::before]:border [&_.fr-label::before]:border-white"
          label={
            <>
              J’accepte les&nbsp;
              <Link href="/cgu">conditions générales d’utilisation</Link>
              &nbsp;du service.
            </>
          }
        />
        <Submit loading={isLoading} iconId="fr-icon-arrow-right-line" iconPosition="right" className="mt-4 bg-white text-blue">
          Envoyer
        </Submit>
        {isSent && (
          <div className="fr-mt-3w">
            <Alert severity="success" title="Merci pour votre attention" description="Nous reviendrons rapidement vers vous." />
          </div>
        )}
      </Form>
    </section>
  );
}
