import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { z } from 'zod';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import Link from '@/components/ui/Link';
import RichSelect from '@/components/ui/RichSelect';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  DEFAULT_SIMULATION_PARAMS,
  type DemandConcern,
  demandConcernOptions,
  ESPACE_EXTERIEUR_VALUES,
  type FranceRenovSpace,
  type HeatingEnergy,
  heatingEnergyOptions,
  type OccupantStatus,
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

const refusalPeriodOptions = [
  { label: 'Il y a moins de 3 mois', value: 'Il y a moins de 3 mois' },
  { label: 'Il y a 3 à 12 mois', value: 'Il y a 3 à 12 mois' },
  { label: 'Il y a plus d’un an', value: 'Il y a plus d’un an' },
];

const refusalReasonOptions = [
  { label: 'Bâtiment trop éloigné du réseau', value: 'Bâtiment trop éloigné du réseau' },
  { label: 'Puissance insuffisante', value: 'Puissance insuffisante' },
  { label: 'Coût du raccordement trop élevé', value: 'Coût du raccordement trop élevé' },
  { label: 'Mode de chauffage individuel', value: 'Mode de chauffage individuel' },
  { label: 'Motif non communiqué', value: 'Motif non communiqué' },
  { label: 'Autre', value: 'Autre' },
];

export type ContactRecipientId = (typeof contactRecipients)[number]['id'];
type ContactFormChaleurRenouvelable = z.infer<typeof zContactFormChaleuRenouvelable>;
type OccupantStatusDetailField = 'demandConcern' | 'housingCount' | 'surfaceArea';

const HEAT_NETWORK_LABEL = 'Réseau de chaleur';

const CONTACT_FORM_DEFAULT_VALUES = {
  comments: '',
  demandConcern: '',
  email: '',
  firstName: '',
  heatingEnergy: 'Électricité',
  housingCount: undefined,
  lastName: '',
  occupantStatus: 'Copropriétaire',
  organizationName: '',
  phone: '',
  projectStatus: [] as ProjectStatus[],
  surfaceArea: undefined,
  termOfUse: false,
} satisfies ContactFormChaleurRenouvelable;

const ORGANIZATION_NAME_OCCUPANT_STATUSES = [
  'Bailleur social',
  "Bureau d'étude ou AMO",
  'Grande entreprise ou Foncière',
  'Mandataire ou Délégataire CEE',
  'Syndicat de copropriété',
  'TPE ou PME',
] as const satisfies readonly OccupantStatus[];

const HOUSING_COUNT_OCCUPANT_STATUSES = [
  'Bailleur social',
  'Copropriétaire',
  'Syndicat de copropriété',
] as const satisfies readonly OccupantStatus[];

const SURFACE_AREA_OCCUPANT_STATUSES = ['Grande entreprise ou Foncière', 'TPE ou PME'] as const satisfies readonly OccupantStatus[];

const DEMAND_CONCERN_OCCUPANT_STATUSES = [
  "Bureau d'étude ou AMO",
  'Mandataire ou Délégataire CEE',
] as const satisfies readonly OccupantStatus[];

function ContactRecipientSelector({
  selectedRecipientId,
  onSelect,
}: {
  selectedRecipientId: ContactRecipientId;
  onSelect: (recipientId: ContactRecipientId) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-4 text-lg font-bold">Où en êtes-vous avec le réseau de chaleur ?</p>

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
                <span className="block">{recipient.label}</span>
                <span className="mt-1 block text-sm text-(--text-default-grey)">{recipient.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectStatusSelect({
  isPublicAdvisorSelected,
  onChange,
  placeholder = 'Sélectionner une ou plusieurs étapes',
  value,
}: {
  isPublicAdvisorSelected: boolean;
  onChange: (value: ProjectStatus[]) => void;
  placeholder?: string;
  value: ProjectStatus[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerLabel = getProjectStatusTriggerLabel(value, placeholder);

  const handleToggleOption = (optionValue: ProjectStatus) => {
    const nextValue = value.includes(optionValue)
      ? value.filter((selectedValue) => selectedValue !== optionValue)
      : [...value, optionValue];

    onChange(nextValue);

    if (nextValue.length > 0) {
      trackPostHogEvent('fcr_contact:project_stage_selected', {
        is_raccordable: !isPublicAdvisorSelected,
        stages: nextValue,
      });
    }
  };

  const handleTriggerClick = () => {
    setIsOpen((currentIsOpen) => !currentIsOpen);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef}>
      <FieldWrapper label="Où en êtes-vous de votre projet ? (optionnel)" className="mb-0">
        <div className="relative">
          <button
            type="button"
            className="fr-select w-full cursor-pointer bg-white text-left"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            onClick={handleTriggerClick}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          >
            <span className={cx('block truncate whitespace-nowrap overflow-hidden text-left', value.length === 0 && 'text-gray-500')}>
              {triggerLabel}
            </span>
          </button>

          {isOpen && (
            <ProjectStatusOptionList selectedValues={value} onClose={() => setIsOpen(false)} onToggleOption={handleToggleOption} />
          )}
        </div>
      </FieldWrapper>
    </div>
  );
}

function ProjectStatusOptionList({
  onClose,
  onToggleOption,
  selectedValues,
}: {
  onClose: () => void;
  onToggleOption: (optionValue: ProjectStatus) => void;
  selectedValues: ProjectStatus[];
}) {
  return (
    <div className="absolute top-full right-0 left-0 z-50 mt-1 border border-gray-200 bg-white shadow-lg">
      <div className="flex justify-end border-b border-gray-200 px-2 py-1">
        <button type="button" className="fr-icon-close-line text-sm" aria-label="Fermer la liste" onClick={onClose} />
      </div>

      <ul className="max-h-64 overflow-auto p-0" role="listbox" aria-multiselectable="true">
        {projectStatusOptions.map((option) => {
          const optionValue = option.nativeInputProps.value;
          const isSelected = selectedValues.includes(optionValue);

          return (
            <li key={optionValue} className="p-0">
              <button
                type="button"
                className={cx('flex w-full cursor-pointer items-start gap-3 px-4 py-2 text-left', isSelected && 'bg-blue-50')}
                aria-selected={isSelected}
                role="option"
                onClick={() => onToggleOption(optionValue)}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span
                  className={cx(
                    'mt-1 flex h-4 w-4 p-2 shrink-0 items-center justify-center border border-blue',
                    isSelected && 'bg-blue text-white'
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <span className="fr-icon-check-line" />}
                </span>
                <span>{option.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getProjectStatusTriggerLabel(value: ProjectStatus[], placeholder: string) {
  if (value.length === 0) {
    return placeholder;
  }

  return value.length === 1 ? value[0] : `${value.length} étapes sélectionnées`;
}

function getFormTitle(isAlternativeAdvisorForm: boolean, isPublicAdvisorSelected: boolean) {
  if (isAlternativeAdvisorForm || isPublicAdvisorSelected) {
    return 'Échangez avec un conseiller neutre et gratuit du service public';
  }

  return 'Faites-vous recontacter par le gestionnaire de réseau';
}

function getFormDescription(isAlternativeAdvisorForm: boolean, isPublicAdvisorSelected: boolean) {
  if (isAlternativeAdvisorForm) {
    return 'Un conseiller du service public vous aidera à identifier la meilleure alternative parmi les solutions compatibles ci-dessus.';
  }

  return isPublicAdvisorSelected
    ? 'Le raccordement au réseau n’a pas pu aboutir. Un conseiller du service public reprend le dossier avec vous pour identifier la meilleure alternative parmi les solutions compatibles ci-dessus.'
    : 'Vous êtes éligible au réseau de chaleur. C’est lui qu’il faut contacter en priorité : le gestionnaire évaluera gratuitement la faisabilité technique et le coût exact du raccordement pour votre bâtiment.';
}

function hasOrganizationNameField(occupantStatus: OccupantStatus) {
  return ORGANIZATION_NAME_OCCUPANT_STATUSES.some((organizationNameOccupantStatus) => organizationNameOccupantStatus === occupantStatus);
}

function getOccupantStatusDetailField(occupantStatus: OccupantStatus): OccupantStatusDetailField | null {
  if (HOUSING_COUNT_OCCUPANT_STATUSES.some((housingCountOccupantStatus) => housingCountOccupantStatus === occupantStatus)) {
    return 'housingCount';
  }

  if (SURFACE_AREA_OCCUPANT_STATUSES.some((surfaceAreaOccupantStatus) => surfaceAreaOccupantStatus === occupantStatus)) {
    return 'surfaceArea';
  }

  return DEMAND_CONCERN_OCCUPANT_STATUSES.some((demandConcernOccupantStatus) => demandConcernOccupantStatus === occupantStatus)
    ? 'demandConcern'
    : null;
}

type DemandFCRFormProps = {
  selectedRecipientId: ContactRecipientId;
  setSelectedRecipientId: (recipientId: ContactRecipientId) => void;
  topSolution: string;
};

/**
 * Displays the contact block matching the recommended heating solution.
 */
export default function DemandFCRForm({ selectedRecipientId, setSelectedRecipientId, topSolution }: DemandFCRFormProps) {
  const shouldShowFranceRenovAdvisorCallout = topSolution !== HEAT_NETWORK_LABEL; // TODO: Re-enable the legacy alternative advisor form from this condition when needed.

  return shouldShowFranceRenovAdvisorCallout ? (
    <FranceRenovAdvisorCallout />
  ) : (
    <HeatNetworkDemandForm
      selectedRecipientId={selectedRecipientId}
      setSelectedRecipientId={setSelectedRecipientId}
      topSolution={topSolution}
    />
  );
}

/**
 * Renders the France Rénov' advisor callout for non heat-network recommendations.
 */
function FranceRenovAdvisorCallout() {
  const chauffageQuery = useChoixChauffageQueryParams();
  const params = chauffageQuery.params;
  const hasLocationInput = Boolean(params.constructionId || params.adresse);
  const franceRenovSpaceQuery = trpc.batEnr.getFranceRenovSpace.useQuery(
    {
      address: params.adresse,
      batimentConstructionId: params.constructionId,
    },
    {
      enabled: hasLocationInput,
      retry: false,
    }
  );

  return (
    <aside
      id="help-ademe"
      className="mt-6 scroll-mt-4 rounded-sm bg-[#FFF7D7] p-6 text-(--text-title-grey)"
      aria-label="Accompagnement France Rénov’"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h4 className="mb-4 text-2xl font-bold">Vous souhaitez aller plus loin ?</h4>
          {hasLocationInput && franceRenovSpaceQuery.isLoading ? (
            <p>Recherche du conseiller France Rénov’ de votre commune…</p>
          ) : (
            <FranceRenovAdvisorDetails franceRenovSpace={franceRenovSpaceQuery.data ?? null} />
          )}
        </div>
        <img className="w-40 shrink-0 self-start md:self-center" src="/img/france-renov-logo.svg" alt="France Rénov’" />
      </div>
    </aside>
  );
}

function FranceRenovAdvisorDetails({ franceRenovSpace }: { franceRenovSpace: FranceRenovSpace | null }) {
  if (!franceRenovSpace) {
    return (
      <>
        <p className="mb-5">
          Un conseiller France Rénov’ vous accompagne <strong>gratuitement et en toute neutralité</strong>.
        </p>
        <Link
          href="https://france-renov.gouv.fr/preparer-projet/trouver-conseiller"
          variant="primary"
          className="fr-btn--lg fr-btn--icon-right fr-icon-external-link-line"
          isExternal
          postHogEventKey="fcr_results:france_renov_cta_clicked"
        >
          Trouver un conseiller France Rénov’
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="mb-4 text-lg">
        Votre espace France Rénov’ : <strong>{franceRenovSpace.name}</strong>
      </p>
      <address className="mb-5 not-italic">
        {franceRenovSpace.address && (
          <div className="flex gap-3 py-2">
            <span className="fr-icon-map-pin-2-fill mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {franceRenovSpace.address}, {franceRenovSpace.zipcode} {franceRenovSpace.city}
            </span>
          </div>
        )}
        {franceRenovSpace.phone && (
          <div className="flex gap-3 py-2">
            <span className="fr-icon-phone-fill mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <a href={`tel:${franceRenovSpace.phone}`}>{formatPhoneNumber(franceRenovSpace.phone)}</a>
              {franceRenovSpace.secondaryPhone && (
                <>
                  <br />
                  <a href={`tel:${franceRenovSpace.secondaryPhone}`}>{formatPhoneNumber(franceRenovSpace.secondaryPhone)}</a>
                </>
              )}
            </span>
          </div>
        )}
        {franceRenovSpace.email && (
          <div className="flex gap-3 py-2">
            <span className="fr-icon-mail-fill mt-0.5 shrink-0" aria-hidden="true" />
            <a href={`mailto:${franceRenovSpace.email}`}>{franceRenovSpace.email}</a>
          </div>
        )}
      </address>
      <Link
        href={franceRenovSpace.website ? getExternalUrl(franceRenovSpace.website) : `mailto:${franceRenovSpace.email}`}
        variant="primary"
        className="fr-btn--lg fr-btn--icon-right fr-icon-external-link-line"
        isExternal={Boolean(franceRenovSpace.website)}
        postHogEventKey="fcr_results:france_renov_cta_clicked"
      >
        Contacter mon conseiller France Rénov’
      </Link>
    </>
  );
}

function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');

  return digits.length === 10 ? digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim() : phone;
}

function getExternalUrl(url: string) {
  return url.startsWith('http') ? url : `https://${url}`;
}

type HeatNetworkDemandFormProps = DemandFCRFormProps;

/**
 * Renders the existing demand form for heat-network contact flows.
 */
function HeatNetworkDemandForm({ selectedRecipientId, setSelectedRecipientId, topSolution }: HeatNetworkDemandFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [refusalPeriod, setRefusalPeriod] = useState('');
  const [refusalReason, setRefusalReason] = useState('');

  const isAlternativeAdvisorForm = topSolution !== HEAT_NETWORK_LABEL;
  const isPublicAdvisorSelected = isAlternativeAdvisorForm || selectedRecipientId === 'public-advisor';

  const createDemandeChaleurRenouvelable = trpc.batEnr.createDemandeChaleurRenouvelable.useMutation();
  const chauffageQuery = useChoixChauffageQueryParams();
  const params = chauffageQuery.params;

  const submitContextRef = useRef({
    createDemandeChaleurRenouvelable,
    isPublicAdvisorSelected,
    params,
    refusalPeriod,
    refusalReason,
    topSolution,
  });
  submitContextRef.current = {
    createDemandeChaleurRenouvelable,
    isPublicAdvisorSelected,
    params,
    refusalPeriod,
    refusalReason,
    topSolution,
  };

  const handleSubmit = useCallback(async ({ value }: { value: ContactFormChaleurRenouvelable }) => {
    const submitContext = submitContextRef.current;
    const submitParams = submitContext.params;

    setIsLoading(true);

    try {
      const espaceExterieur =
        isDefined(submitParams.espaceExterieur) && ESPACE_EXTERIEUR_VALUES.includes(submitParams.espaceExterieur)
          ? submitParams.espaceExterieur
          : DEFAULT_SIMULATION_PARAMS.espaceExterieur;

      const typeLogement = submitParams.typeLogement ?? DEFAULT_SIMULATION_PARAMS.typeLogement;
      const occupantStatusDetailField = getOccupantStatusDetailField(value.occupantStatus);
      const housingCount =
        occupantStatusDetailField === 'housingCount' && value.housingCount !== undefined
          ? value.housingCount
          : Number(submitParams.nbLogements || DEFAULT_SIMULATION_PARAMS.nbLogements);
      const averageArea =
        occupantStatusDetailField === 'surfaceArea' && value.surfaceArea !== undefined
          ? value.surfaceArea
          : Number(submitParams.surfaceMoyenne || DEFAULT_SIMULATION_PARAMS.surfaceMoyenne);
      const demandConcern = occupantStatusDetailField === 'demandConcern' && value.demandConcern ? value.demandConcern : null;
      const organizationName =
        hasOrganizationNameField(value.occupantStatus) && value.organizationName.trim().length > 0 ? value.organizationName.trim() : null;
      const surfaceArea = occupantStatusDetailField === 'surfaceArea' ? (value.surfaceArea ?? null) : null;

      trackPostHogEvent('fcr_contact:form_submitted', {
        energy: value.heatingEnergy,
        is_raccordable: !submitContext.isPublicAdvisorSelected,
        nb_logements: housingCount,
        non_raccordable_reason: submitContext.isPublicAdvisorSelected ? submitContext.refusalReason || undefined : undefined,
        phone_filled: value.phone.trim().length > 0,
        profile: value.occupantStatus,
        project_stages: value.projectStatus,
        top_solution: submitContext.topSolution,
      });

      await submitContext.createDemandeChaleurRenouvelable.mutateAsync({
        address: submitParams.adresse ?? '',
        averageArea,
        averageResidents: Number(submitParams.habitantsMoyen || DEFAULT_SIMULATION_PARAMS.habitantsMoyen),
        batimentConstructionId: submitParams.constructionId,
        comments: value.comments.trim() || null,
        demandConcern,
        dpe: submitParams.dpe,
        email: value.email,
        firstName: value.firstName,
        heatingEnergy: value.heatingEnergy,
        hotWaterSystemType: submitParams.modeEauChaudeSanitaire,
        housingCount,
        housingType: typeLogement,
        isPublicAdvisorSelected: submitContext.isPublicAdvisorSelected,
        lastName: value.lastName,
        occupantStatus: value.occupantStatus,
        organizationName,
        outdoorSpace: espaceExterieur,
        phone: value.phone,
        projectStatus: value.projectStatus,
        radiatorType: submitParams.typeRadiateur,
        refusalPeriod: submitContext.isPublicAdvisorSelected ? submitContext.refusalPeriod || null : null,
        refusalReason: submitContext.isPublicAdvisorSelected ? submitContext.refusalReason || null : null,
        simulationUrl: window.location.href,
        surfaceArea,
      });

      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmitWithErrors = useMemo(
    () =>
      toastErrors(
        handleSubmit,
        () => 'Une erreur est survenue pendant l’envoi de votre demande. Veuillez réessayer dans quelques instants.'
      ),
    [handleSubmit]
  );

  const formOptions = useMemo(
    () => ({
      defaultValues: CONTACT_FORM_DEFAULT_VALUES,
      onSubmit: handleSubmitWithErrors,
      schema: zContactFormChaleuRenouvelable,
    }),
    [handleSubmitWithErrors]
  );

  const { Field, Form, Submit, form, useValue } = useForm<typeof zContactFormChaleuRenouvelable>(formOptions);

  const selectedOccupantStatus = useValue<OccupantStatus>('occupantStatus') ?? CONTACT_FORM_DEFAULT_VALUES.occupantStatus;
  const occupantStatusDetailField = getOccupantStatusDetailField(selectedOccupantStatus);
  const shouldShowOrganizationName = hasOrganizationNameField(selectedOccupantStatus);

  return (
    <section id="help-ademe" className="mt-6 scroll-mt-4 rounded-sm bg-[#FFF7D7] p-6 text-(--text-title-grey)">
      <h4 className="mb-4 text-2xl font-bold">{getFormTitle(isAlternativeAdvisorForm, isPublicAdvisorSelected)}</h4>
      <p className="mb-4 max-w-5xl">{getFormDescription(isAlternativeAdvisorForm, isPublicAdvisorSelected)}</p>
      {!isAlternativeAdvisorForm && (
        <ContactRecipientSelector
          selectedRecipientId={selectedRecipientId}
          onSelect={(recipientId) => {
            if (recipientId === 'public-advisor') {
              trackPostHogEvent('fcr_contact:non_raccordable_checked');
            }
            setSelectedRecipientId(recipientId);
          }}
        />
      )}
      <div className="mb-4 flex items-start gap-3 border-l-4 border-[#F6C23E] bg-[#FFEBA3] px-4 py-3 font-bold">
        <span className="fr-icon-mail-line mt-0.5" aria-hidden="true" />
        <span>
          {isPublicAdvisorSelected
            ? 'Votre demande sera transmise à un conseiller du service public. L’accompagnement est gratuit.'
            : 'Votre demande sera transmise au gestionnaire du réseau de chaleur.'}
        </span>
      </div>
      <Form>
        {isPublicAdvisorSelected && !isAlternativeAdvisorForm && (
          <p className="mb-4 text-lg font-bold">Pour aider le conseiller du service public à prendre le relais</p>
        )}
        <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 [&_.fr-error-text]:text-error [&_.fr-input]:bg-white [&_.fr-label]:text-(--text-title-grey) [&_.fr-select]:bg-white">
          {isPublicAdvisorSelected && !isAlternativeAdvisorForm && (
            <>
              <RichSelect
                label="Motif communiqué par le gestionnaire de réseau"
                options={refusalReasonOptions}
                placeholder="Sélectionner le motif"
                value={refusalReason || undefined}
                onChange={(reason) => {
                  trackPostHogEvent('fcr_contact:non_raccordable_reason_selected', { reason });
                  setRefusalReason(reason);
                }}
              />
              <RichSelect
                label="Quand avez-vous reçu le refus du gestionnaire ? (optionnel)"
                options={refusalPeriodOptions}
                placeholder="Sélectionner..."
                value={refusalPeriod || undefined}
                onChange={setRefusalPeriod}
              />
            </>
          )}
          <div className={cx(!shouldShowOrganizationName && !isAlternativeAdvisorForm && 'md:col-span-2 mb-5')}>
            <form.Field
              name="occupantStatus"
              children={(field) => (
                <RichSelect<OccupantStatus>
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
          </div>
          {isAlternativeAdvisorForm && (
            <form.Field
              name="heatingEnergy"
              children={(field) => (
                <RichSelect<HeatingEnergy>
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
          )}
          {shouldShowOrganizationName && !isAlternativeAdvisorForm && (
            <Field.Input name="organizationName" label="Nom de votre structure" />
          )}
          <Field.Input name="lastName" label="Nom" />
          <Field.Input name="firstName" label="Prénom" />
          <Field.EmailInput name="email" label="Email" />
          <Field.PhoneInput name="phone" label="Téléphone" />
          {!isAlternativeAdvisorForm && (
            <form.Field
              name="heatingEnergy"
              children={(field) => (
                <RichSelect<HeatingEnergy>
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
          )}
          {occupantStatusDetailField === 'housingCount' && !isAlternativeAdvisorForm && (
            <Field.Input
              name="housingCount"
              label="Nombre de logements"
              nativeInputProps={{
                inputMode: 'numeric',
                min: 1,
                type: 'number',
              }}
            />
          )}
          {occupantStatusDetailField === 'surfaceArea' && !isAlternativeAdvisorForm && (
            <Field.Input
              name="surfaceArea"
              label="Surface en m²"
              nativeInputProps={{
                inputMode: 'numeric',
                min: 1,
                type: 'number',
              }}
            />
          )}
          {occupantStatusDetailField === 'demandConcern' && !isAlternativeAdvisorForm && (
            <form.Field
              name="demandConcern"
              children={(field) => (
                <RichSelect<DemandConcern>
                  label="Votre demande concerne"
                  value={field.state.value || undefined}
                  onChange={field.handleChange}
                  options={demandConcernOptions}
                  placeholder="Sélectionner une option"
                />
              )}
            />
          )}
          <div>
            <form.Field
              name="projectStatus"
              children={(field) => (
                <>
                  <ProjectStatusSelect
                    value={field.state.value}
                    onChange={field.handleChange}
                    isPublicAdvisorSelected={isPublicAdvisorSelected}
                    placeholder={isAlternativeAdvisorForm ? 'Sélectionner une ou plusieurs option(s)' : undefined}
                  />

                  {field.state.value.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.state.value.map((status) => (
                        <span key={status} className="rounded-full bg-[#E3E3FD] px-3 py-1 text-xs font-medium text-blue">
                          {status}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            />
          </div>
          {!isAlternativeAdvisorForm && (
            <Field.Textarea
              name="comments"
              label="Si besoin, vous pouvez ajouter ici toute autre information utile liée à votre projet"
              className="w-full md:col-span-2 mt-5"
              nativeTextAreaProps={{
                rows: 3,
              }}
            />
          )}
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
