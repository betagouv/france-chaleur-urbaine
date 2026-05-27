import { type ComponentType, useState } from 'react';

import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import Link from '@/components/ui/Link';
import Select from '@/components/ui/RichSelect';
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
import cx from '@/utils/cx';

const contactRecipients = [
  {
    description: 'Première démarche : votre demande sera transmise au gestionnaire de réseau',
    id: 'network-manager',
    label: 'Je n’ai pas encore contacté le gestionnaire',
  },
  {
    description: 'Votre demande sera transmise à un conseiller du service public pour explorer les alternatives',
    id: 'public-advisor',
    label: 'J’ai déjà reçu un refus ou une réponse négative',
  },
] satisfies Array<{
  description: string;
  id: string;
  label: string;
}>;

type ContactRecipientId = (typeof contactRecipients)[number]['id'];

function ContactRecipientSelector({
  selectedRecipientId,
  onSelect,
}: {
  selectedRecipientId: ContactRecipientId;
  onSelect: (recipientId: ContactRecipientId) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-4 text-lg">Où en êtes-vous avec le réseau de chaleur ?</p>
      <div className="grid gap-4 md:grid-cols-2">
        {contactRecipients.map((recipient) => {
          const isSelected = selectedRecipientId === recipient.id;

          return (
            <button
              key={recipient.id}
              type="button"
              className={cx(
                'flex min-h-24 items-start gap-3 border border-transparent bg-white px-4 py-4 text-left',
                isSelected && 'border-blue'
              )}
              aria-pressed={isSelected}
              onClick={() => onSelect(recipient.id)}
            >
              <span
                className={cx(
                  'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue',
                  isSelected && 'bg-blue'
                )}
                aria-hidden="true"
              >
                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
              </span>
              <span>
                <span className="block font-bold">{recipient.label}</span>
                <span className="mt-1 block text-sm text-(--text-default-grey)">{recipient.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DemandFCRForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<ContactRecipientId>('network-manager');
  const [refusalPeriod, setRefusalPeriod] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
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
  const isPublicAdvisorSelected = selectedRecipientId === 'public-advisor';

  return (
    <section id="help-ademe" className="mt-6 rounded-sm bg-[#FFF7D7] p-6 text-(--text-title-grey)">
      <h4 className="mb-4 text-2xl font-bold">
        {isPublicAdvisorSelected
          ? 'Échangez avec un conseiller neutre et gratuit du service public'
          : 'Faites-vous recontacter par le gestionnaire de réseau'}
      </h4>
      <p className="mb-4 max-w-5xl">
        {isPublicAdvisorSelected
          ? 'Le raccordement au réseau n’a pas pu aboutir. Un conseiller du service public reprend le dossier avec vous pour identifier la meilleure alternative parmi les solutions compatibles ci-dessus.'
          : 'Vous êtes éligible au réseau de chaleur. C’est lui qu’il faut contacter en priorité : le gestionnaire évaluera gratuitement la faisabilité technique et le coût exact du raccordement pour votre bâtiment.'}
      </p>
      <ContactRecipientSelector selectedRecipientId={selectedRecipientId} onSelect={setSelectedRecipientId} />
      <div className="mb-4 flex items-start gap-3 border-l-4 border-[#F6C23E] bg-[#FFEBA3] px-4 py-3 font-bold">
        <span className="fr-icon-mail-line mt-0.5" aria-hidden="true" />
        <span>
          {isPublicAdvisorSelected
            ? 'Votre demande sera transmise à un conseiller du service public. L’accompagnement est gratuit.'
            : 'Votre demande sera transmise au gestionnaire du réseau de chaleur.'}
        </span>
      </div>
      <Form>
        {isPublicAdvisorSelected && (
          <p className="mb-4 text-lg font-bold">Pour aider le conseiller du service public à prendre le relais</p>
        )}
        <div
          className={
            'grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 [&_.fr-error-text]:text-error [&_.fr-input]:bg-white [&_.fr-label]:text-(--text-title-grey) [&_.fr-select]:bg-white'
          }
        >
          {isPublicAdvisorSelected && (
            <>
              <Select
                label="Quand avez-vous reçu le refus du gestionnaire ?"
                options={[
                  { label: 'Il y a moins de 3 mois', value: 'Il y a moins de 3 mois' },
                  { label: 'Il y a 3 à 12 mois', value: 'Il y a 3 à 12 mois' },
                  { label: 'Il y a plus d’un an', value: 'Il y a plus d’un an' },
                ]}
                placeholder="Sélectionner..."
                value={refusalPeriod}
                onChange={setRefusalPeriod}
              />
              <Select
                label="Motif communiqué"
                options={[
                  { label: 'Bâtiment trop éloigné du réseau', value: 'Bâtiment trop éloigné du réseau' },
                  { label: 'Puissance insuffisante', value: 'Puissance insuffisante' },
                  { label: 'Coût du raccordement trop élevé', value: 'Coût du raccordement trop élevé' },
                  { label: 'Mode de chauffage individuel', value: 'Mode de chauffage individuel' },
                  { label: 'Autre', value: 'Autre' },
                  { label: 'Motif inconnu', value: 'Motif inconnu' },
                ]}
                placeholder="Sélectionner le motif"
                value={refusalReason}
                onChange={setRefusalReason}
              />
            </>
          )}
          <Field.Select name="occupantStatus" label="Vous êtes" options={occupantStatusOptions} />
          <Field.Select name="heatingEnergy" label="Énergie de chauffage" options={heatingEnergyOptions} />
          <Field.Input name="lastName" label="Nom" />
          <Field.Input name="firstName" label="Prénom" />
          <Field.EmailInput name="email" label="Email" />
          <Field.PhoneInput name="phone" label="Téléphone (optionnel)" />
          <div>
            <SelectProjectStatus
              name="projectStatus"
              label="Où en êtes-vous de votre projet ? (optionnel)"
              options={projectStatusOptions}
              small
            />
            {selectedProjectStatus.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProjectStatus.map((status) => (
                  <span key={status} className="rounded-full bg-[#E3E3FD] px-3 py-1 text-xs font-medium text-blue">
                    {status}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Field.Checkbox
          name="termOfUse"
          className="mt-4 [&_.fr-label]:text-(--text-title-grey) [&_.fr-label::before]:border [&_.fr-label::before]:border-(--text-title-grey)"
          label={
            <>
              J’accepte les&nbsp;
              <Link href="/cgu">conditions générales d’utilisation</Link>
              &nbsp;du service.
            </>
          }
        />
        <Submit loading={isLoading} disabled={isSent} iconId="fr-icon-arrow-right-line" iconPosition="right" className="mt-4">
          Envoyer
        </Submit>
        {isSent && (
          <Alert className="fr-mt-3w" variant="success" title="Merci pour votre attention">
            Nous reviendrons rapidement vers vous.
          </Alert>
        )}
      </Form>
    </section>
  );
}
