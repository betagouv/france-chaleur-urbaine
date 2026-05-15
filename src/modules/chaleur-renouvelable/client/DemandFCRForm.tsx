import { type ComponentType, useState } from 'react';

import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import Link from '@/components/ui/Link';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  ESPACE_EXTERIEUR_VALUES,
  heatingEnergyOptions,
  occupantStatusOptions,
  type ProjectStatus,
  projectStatusOptions,
  zContactFormChaleuRenouvelable,
} from '@/modules/chaleur-renouvelable/constants';
import trpc from '@/modules/trpc/client';
import { isDefined } from '@/utils/core';

export default function DemandFCRForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const createDemandeChaleurRenouvelable = trpc.batEnr.createDemandeChaleurRenouvelable.useMutation();
  const urlParams = useChoixChauffageQueryParams();
  const { Field, Form, Submit, useValue } = useForm<typeof zContactFormChaleuRenouvelable>({
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
      try {
        const espaceExterieur =
          isDefined(urlParams.espaceExterieur) && ESPACE_EXTERIEUR_VALUES.includes(urlParams.espaceExterieur)
            ? urlParams.espaceExterieur
            : 'none';
        const typeLogement = urlParams.typeLogement ?? 'immeuble_chauffage_collectif';

        await createDemandeChaleurRenouvelable.mutateAsync({
          address: urlParams.adresse ?? '',
          averageArea: Number(urlParams.surfaceMoyenne || 70),
          averageResidents: Number(urlParams.habitantsMoyen || 2),
          dpe: urlParams.dpe,
          email: value.email,
          firstName: value.firstName,
          heatingEnergy: value.heatingEnergy,
          housingCount: Number(urlParams.nbLogements || 25),
          housingType: typeLogement,
          lastName: value.lastName,
          occupantStatus: value.occupantStatus,
          outdoorSpace: espaceExterieur,
          phone: value.phone,
          projectStatus: value.projectStatus,
          simulationUrl: window.location.href,
        });
        setIsSent(true);
      } finally {
        setIsLoading(false);
      }
    },
    schema: zContactFormChaleuRenouvelable,
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
            'grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 [&_.fr-label]:text-white [&_.fr-input]:bg-white [&_.fr-select]:bg-white [&_.fr-error-text]:text-white'
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
        <Submit
          loading={isLoading}
          disabled={isSent}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          className="mt-4 bg-white text-blue"
        >
          Envoyer
        </Submit>
        {isSent && (
          <Alert className="text-white fr-mt-3w" variant="success" title="Merci pour votre attention">
            Nous reviendrons rapidement vers vous.
          </Alert>
        )}
      </Form>
    </section>
  );
}
