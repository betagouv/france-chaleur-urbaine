import { useState } from 'react';

import DsfrSelectCheckboxes from '@/components/form/dsfr/SelectCheckboxes';
import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import Link from '@/components/ui/Link';
import RichSelect from '@/components/ui/RichSelect';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  DEFAULT_SIMULATION_PARAMS,
  ESPACE_EXTERIEUR_VALUES,
  heatingEnergyOptions,
  occupantStatusOptions,
  type ProjectStatus,
  projectStatusOptions,
  zContactFormChaleuRenouvelable,
} from '@/modules/chaleur-renouvelable/constants';
import { toastErrors } from '@/modules/notification';
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
] as const;

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
                'flex min-h-24 items-start gap-3 border border-transparent bg-white p-4 text-left',
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

type ProjectStatusSelectProps = {
  className?: string;
  label?: string;
  onChange?: (value: ProjectStatus[]) => void;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
  options: typeof projectStatusOptions;
  small?: boolean;
  value?: ProjectStatus[];
  isPublicAdvisorSelected: boolean;
};

function ProjectStatusSelect({ label, onChange, options, isPublicAdvisorSelected, value = [], ...props }: ProjectStatusSelectProps) {
  return (
    <DsfrSelectCheckboxes
      fieldId="projectStatus"
      label={label}
      options={options.map((option) => {
        const optionValue = option.nativeInputProps.value;

        return {
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            'aria-label': option.label,
            checked: value.includes(optionValue),
            name: 'projectStatus',
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              const nextValue = event.target.checked
                ? [...value, optionValue]
                : value.filter((selectedValue) => selectedValue !== optionValue);

              onChange?.(nextValue);

              if (nextValue.length > 0) {
                trackPostHogEvent('fcr_contact:project_stage_selected', {
                  is_raccordable: !isPublicAdvisorSelected,
                  stages: nextValue,
                });
              }
            },
            value: optionValue,
          },
        };
      })}
      {...props}
    />
  );
}

export default function DemandFCRForm({ topSolution }: { topSolution?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<ContactRecipientId>('network-manager');
  const [isProjectStatusSelectOpen, setIsProjectStatusSelectOpen] = useState(false);
  const [refusalPeriod, setRefusalPeriod] = useState('');
  const [refusalReason, setRefusalReason] = useState('');

  const isPublicAdvisorSelected = selectedRecipientId === 'public-advisor';

  const createDemandeChaleurRenouvelable = trpc.batEnr.createDemandeChaleurRenouvelable.useMutation();
  const chauffageQuery = useChoixChauffageQueryParams();
  const params = chauffageQuery.params;

  const { Field, Form, Submit, form, useValue } = useForm<typeof zContactFormChaleuRenouvelable>({
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
    onSubmit: toastErrors(
      async ({ value }) => {
        setIsLoading(true);

        try {
          const espaceExterieur =
            isDefined(params.espaceExterieur) && ESPACE_EXTERIEUR_VALUES.includes(params.espaceExterieur)
              ? params.espaceExterieur
              : DEFAULT_SIMULATION_PARAMS.espaceExterieur;

          const typeLogement = params.typeLogement ?? DEFAULT_SIMULATION_PARAMS.typeLogement;
          const housingCount = Number(params.nbLogements || DEFAULT_SIMULATION_PARAMS.nbLogements);

          trackPostHogEvent('fcr_contact:form_submitted', {
            energy: value.heatingEnergy,
            is_raccordable: !isPublicAdvisorSelected,
            nb_logements: housingCount,
            non_raccordable_reason: isPublicAdvisorSelected ? refusalReason || undefined : undefined,
            phone_filled: value.phone.trim().length > 0,
            profile: value.occupantStatus,
            project_stages: value.projectStatus,
            top_solution: topSolution,
          });

          await createDemandeChaleurRenouvelable.mutateAsync({
            address: params.adresse ?? '',
            averageArea: Number(params.surfaceMoyenne || DEFAULT_SIMULATION_PARAMS.surfaceMoyenne),
            averageResidents: Number(params.habitantsMoyen || DEFAULT_SIMULATION_PARAMS.habitantsMoyen),
            batimentConstructionId: params.constructionId,
            dpe: params.dpe,
            email: value.email,
            firstName: value.firstName,
            heatingEnergy: value.heatingEnergy,
            hotWaterSystemType: params.modeEauChaudeSanitaire,
            housingCount,
            housingType: typeLogement,
            isPublicAdvisorSelected,
            lastName: value.lastName,
            occupantStatus: value.occupantStatus,
            outdoorSpace: espaceExterieur,
            phone: value.phone,
            projectStatus: value.projectStatus,
            radiatorType: params.typeRadiateur,
            refusalPeriod: isPublicAdvisorSelected ? refusalPeriod || null : null,
            refusalReason: isPublicAdvisorSelected ? refusalReason || null : null,
            simulationUrl: window.location.href,
          });

          setIsSent(true);
        } finally {
          setIsLoading(false);
        }
      },
      () => 'Une erreur est survenue pendant l’envoi de votre demande. Veuillez réessayer dans quelques instants.'
    ),
    schema: zContactFormChaleuRenouvelable,
  });

  const selectedProjectStatus = useValue<ProjectStatus[]>('projectStatus') ?? [];

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
      <ContactRecipientSelector
        selectedRecipientId={selectedRecipientId}
        onSelect={(recipientId) => {
          if (recipientId === 'public-advisor') {
            trackPostHogEvent('fcr_contact:non_raccordable_checked');
          }
          setSelectedRecipientId(recipientId);
        }}
      />
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
        <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 [&_.fr-error-text]:text-error [&_.fr-input]:bg-white [&_.fr-label]:text-(--text-title-grey) [&_.fr-select]:bg-white">
          {isPublicAdvisorSelected && (
            <>
              <RichSelect
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
              <RichSelect
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
                onChange={(reason) => {
                  if (reason) {
                    trackPostHogEvent('fcr_contact:non_raccordable_reason_selected', { reason });
                  }

                  setRefusalReason(reason);
                }}
              />
            </>
          )}
          <form.Field
            name="occupantStatus"
            children={(field) => (
              <RichSelect
                label="Vous êtes"
                value={field.state.value}
                onChange={field.handleChange}
                options={occupantStatusOptions}
                postHogEventKey="fcr_contact:profile_selected"
                postHogEventProps={(profile) => ({
                  is_raccordable: !isPublicAdvisorSelected,
                  profile,
                })}
              />
            )}
          />
          <form.Field
            name="heatingEnergy"
            children={(field) => (
              <RichSelect
                label="Énergie de chauffage"
                value={field.state.value}
                onChange={field.handleChange}
                options={heatingEnergyOptions}
                postHogEventKey="fcr_contact:energy_selected"
                postHogEventProps={(energy) => ({
                  energy,
                  is_raccordable: !isPublicAdvisorSelected,
                })}
              />
            )}
          />
          <Field.Input name="lastName" label="Nom" />
          <Field.Input name="firstName" label="Prénom" />
          <Field.EmailInput name="email" label="Email" />
          <Field.PhoneInput name="phone" label="Téléphone" />
          <div>
            <form.Field
              name="projectStatus"
              children={(field) => (
                <ProjectStatusSelect
                  label="Où en êtes-vous de votre projet ? (optionnel)"
                  value={field.state.value}
                  onChange={field.handleChange}
                  open={isProjectStatusSelectOpen}
                  onOpenChange={setIsProjectStatusSelectOpen}
                  options={projectStatusOptions}
                  isPublicAdvisorSelected={isPublicAdvisorSelected}
                  small
                />
              )}
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
          postHogEventKey="fcr_contact:cgu_accepted"
          postHogEventProps={{ is_raccordable: !isPublicAdvisorSelected }}
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
