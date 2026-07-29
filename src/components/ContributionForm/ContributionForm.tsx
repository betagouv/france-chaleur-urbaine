import Alert from '@codegouvfr/react-dsfr/Alert';
import { useStore } from '@tanstack/react-form';
import Link from 'next/link';
import { useState } from 'react';

import Checkbox from '@/components/form/dsfr/Checkbox';
import CallOut from '@/components/ui/CallOut';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm, withFieldGroup } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import { postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';

import { type ContributionNetworkSearchResult, ContributionNetworkSncuField } from './ContributionNetworkSncuField';
import {
  type ContributionFormValues,
  contributionDefaultValues,
  docAllowedExtensions,
  docFichiersValidator,
  filesLimits,
  geoAllowedExtensions,
  geoFichiersValidator,
  optionalGeoFichiersValidator,
  typesDemande,
  typesUtilisateur,
  zContributionForm,
  zContributionFormData,
} from './schema';

const typeUtilisateurOptions = typesUtilisateur.map((option) => ({
  label: option.label,
  nativeInputProps: { value: option.key },
}));

const typeDemandeOptions = typesDemande.map((option) => ({
  label: option.label,
  nativeInputProps: { value: option.key },
}));

const contributionFormRootFields = {
  commentaire: 'commentaire',
  dansCadreDemandeADEME: 'dansCadreDemandeADEME',
  dateMiseEnServicePrevisionnelle: 'dateMiseEnServicePrevisionnelle',
  email: 'email',
  emailReferentCommercial: 'emailReferentCommercial',
  fichiers: 'fichiers',
  fichiersPDP: 'fichiersPDP',
  gestionnaire: 'gestionnaire',
  identifiantReseau: 'identifiantReseau',
  localisation: 'localisation',
  maitreOuvrage: 'maitreOuvrage',
  nom: 'nom',
  nomReseau: 'nomReseau',
  ouvertAuxRaccordements: 'ouvertAuxRaccordements',
  precisions: 'precisions',
  prenom: 'prenom',
  puissanceTotalePrevisionnelleMW: 'puissanceTotalePrevisionnelleMW',
  reseauDeclasse: 'reseauDeclasse',
  typeDemande: 'typeDemande',
  typeUtilisateur: 'typeUtilisateur',
  typeUtilisateurAutre: 'typeUtilisateurAutre',
} as const;

const typeDemandeStringResetFieldNames = [
  'commentaire',
  'dateMiseEnServicePrevisionnelle',
  'emailReferentCommercial',
  'gestionnaire',
  'localisation',
  'maitreOuvrage',
  'nomReseau',
  'precisions',
] as const;
const typeDemandeUndefinedResetFieldNames = ['fichiers', 'ouvertAuxRaccordements', 'puissanceTotalePrevisionnelleMW'] as const;

type ContributionUploadConfig = {
  allowedExtensions: string[];
  formatsHint: string;
  fichiersValidator: typeof geoFichiersValidator;
};

const geoUploadConfig = {
  allowedExtensions: geoAllowedExtensions,
  fichiersValidator: geoFichiersValidator,
  formatsHint: 'Formats préférentiels : GeoJSON, Shapefile (au moins shp + prj), KML, GeoPackage.',
} satisfies ContributionUploadConfig;

const optionalPdpUploadConfig = {
  ...geoUploadConfig,
  fichiersValidator: optionalGeoFichiersValidator,
} satisfies ContributionUploadConfig;

const docUploadConfig = {
  allowedExtensions: docAllowedExtensions,
  fichiersValidator: docFichiersValidator,
  formatsHint: 'Formats préférentiels : PDF, Word.',
} satisfies ContributionUploadConfig;

/**
 * Public contribution form: network managers/collectivités submit geo data
 * (network traces, priority perimeters, master plans) with file uploads.
 * The fields depend on the selected demand type (discriminated union schema).
 */
function ContributionForm() {
  const [formSuccess, setFormSuccess] = useState(false);
  const [selectedContributionNetwork, setSelectedContributionNetwork] = useState<ContributionNetworkSearchResult | null>(null);
  const [hasNoSncuIdentifier, setHasNoSncuIdentifier] = useState(false);

  const form = useAppForm({
    ...schemaValidation(zContributionForm),
    defaultValues: contributionDefaultValues,
    onSubmit: toastErrors(
      async ({ value }) => {
        trackPostHogEvent('map:manager_contact_form_submitted');
        // re-parse through the union: strips the fields of unselected branches and types the output
        await postFormDataFetchJSON('/api/contribution', await zContributionFormData.parseAsync(value));
        setFormSuccess(true);
      },
      () => (
        <span>
          Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous via le{' '}
          <Link href="/contact">formulaire de contact</Link>
        </span>
      )
    ),
  });

  const typeUtilisateur = useStore(form.store, (state) => state.values.typeUtilisateur);
  const typeDemande = useStore(form.store, (state) => state.values.typeDemande);
  const dansCadreDemandeADEME = useStore(form.store, (state) => state.values.dansCadreDemandeADEME);
  const isSelectedContributionNetworkClassed = selectedContributionNetwork?.is_classe === true;

  const resetClassedNetworkFields = () => {
    form.setFieldValue('reseauDeclasse', false, { dontUpdateMeta: true });
    form.setFieldValue('fichiersPDP', undefined, { dontUpdateMeta: true });
  };

  const resetSncuIdentificationFields = () => {
    setSelectedContributionNetwork(null);
    setHasNoSncuIdentifier(false);
    form.setFieldValue('identifiantReseau', '', { dontUpdateMeta: true });
    resetClassedNetworkFields();
  };

  const resetTypeDemandeDependentFields = () => {
    resetSncuIdentificationFields();
    typeDemandeStringResetFieldNames.forEach((fieldName) => form.setFieldValue(fieldName, '', { dontUpdateMeta: true }));
    typeDemandeUndefinedResetFieldNames.forEach((fieldName) => form.setFieldValue(fieldName, undefined, { dontUpdateMeta: true }));
  };

  const handleContributionNetworkClear = () => {
    setSelectedContributionNetwork(null);
    form.setFieldValue('identifiantReseau', '');
    resetClassedNetworkFields();
  };

  const handleContributionNetworkSelect = (network: ContributionNetworkSearchResult, shouldPrefillNetworkFields: boolean) => {
    setSelectedContributionNetwork(network);
    setHasNoSncuIdentifier(false);
    resetClassedNetworkFields();

    if (!shouldPrefillNetworkFields) {
      return;
    }

    form.setFieldValue('nomReseau', network.nom_reseau ?? '');
    form.setFieldValue('localisation', network.localisation ?? '');
    form.setFieldValue('gestionnaire', network.gestionnaire ?? '');
    form.setFieldValue('maitreOuvrage', network.maitre_ouvrage ?? '');
  };

  const handleNoSncuIdentifierChange = (checked: boolean) => {
    setHasNoSncuIdentifier(checked);
    if (checked) {
      handleContributionNetworkClear();
    }
  };

  return formSuccess ? (
    <Alert
      severity="success"
      title="Nous vous remercions pour votre contribution."
      description={
        <>
          Son intégration sur la carte sera réalisée sous quelques semaines.{' '}
          {form.state.values.dansCadreDemandeADEME
            ? "L'attestation pour votre dossier de demande de subvention ADEME vous sera transmise sous quelques jours."
            : 'Nous vous tiendrons au courant.'}
        </>
      }
    />
  ) : (
    <Form form={form}>
      <form.AppField
        name="typeUtilisateur"
        listeners={{
          onChange: ({ value }) => {
            if (value !== 'Autre') {
              form.setFieldValue('typeUtilisateurAutre', '', { dontUpdateMeta: true });
            }
          },
        }}
      >
        {(field) => <field.RadioField label="Vous êtes :" options={typeUtilisateurOptions} />}
      </form.AppField>
      {typeUtilisateur === 'Autre' && (
        <form.AppField name="typeUtilisateurAutre">
          {(field) => <field.TextField label="Précisez :" nativeInputProps={{ required: true }} />}
        </form.AppField>
      )}

      <form.AppField name="nom">
        {(field) => <field.TextField label="Votre nom :" nativeInputProps={{ autoComplete: 'nom', placeholder: 'Saisir votre nom' }} />}
      </form.AppField>
      <form.AppField name="prenom">
        {(field) => (
          <field.TextField label="Votre prénom :" nativeInputProps={{ autoComplete: 'prenom', placeholder: 'Saisir votre prénom' }} />
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.EmailField label="Votre adresse email :" nativeInputProps={{ placeholder: 'Saisir votre email' }} />}
      </form.AppField>

      <form.AppField name="dansCadreDemandeADEME">
        {(field) => <field.BooleanRadioField label="Votre contribution s’inscrit dans le cadre d’une demande de subvention ADEME :" />}
      </form.AppField>
      {dansCadreDemandeADEME && (
        <Alert
          description="L'attestation vous sera envoyée par mail sous quelques jours, après vérification des fichiers transmis."
          severity="info"
          className="fr-mt-n2w fr-mb-3w"
          small
        />
      )}

      <form.AppField
        name="typeDemande"
        listeners={{
          onChange: () => resetTypeDemandeDependentFields(),
        }}
      >
        {(field) => <field.RadioField label="Vous souhaitez :" options={typeDemandeOptions} />}
      </form.AppField>

      {typeDemande === 'ajout tracé réseau existant' && (
        <ContributionNetworkFields
          form={form}
          fields={contributionFormRootFields}
          hasNoSncuIdentifier={hasNoSncuIdentifier}
          isSelectedContributionNetworkClassed={isSelectedContributionNetworkClassed}
          onNoSncuIdentifierChange={handleNoSncuIdentifierChange}
          onNetworkClear={handleContributionNetworkClear}
          onNetworkSelect={handleContributionNetworkSelect}
          selectedContributionNetwork={selectedContributionNetwork}
        />
      )}
      {typeDemande === 'ajout tracé réseau en construction' && (
        <ContributionNetworkFields
          form={form}
          fields={contributionFormRootFields}
          hasNoSncuIdentifier={hasNoSncuIdentifier}
          isSelectedContributionNetworkClassed={isSelectedContributionNetworkClassed}
          onNoSncuIdentifierChange={handleNoSncuIdentifierChange}
          onNetworkClear={handleContributionNetworkClear}
          onNetworkSelect={handleContributionNetworkSelect}
          selectedContributionNetwork={selectedContributionNetwork}
          withConstructionFields
        />
      )}
      {typeDemande === 'ajout périmètre développement prioritaire' && (
        <ContributionPriorityPerimeterFields
          form={form}
          fields={contributionFormRootFields}
          hasNoSncuIdentifier={hasNoSncuIdentifier}
          onNoSncuIdentifierChange={handleNoSncuIdentifierChange}
          onNetworkClear={handleContributionNetworkClear}
          onNetworkSelect={handleContributionNetworkSelect}
          selectedContributionNetwork={selectedContributionNetwork}
        />
      )}
      {typeDemande === 'ajout schéma directeur' && <ContributionMasterPlanFields form={form} fields={contributionFormRootFields} />}
      {typeDemande === 'autre' && <form.AppField name="precisions">{(field) => <field.TextField label="Précisez :" />}</form.AppField>}

      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

type ContributionNetworkSelectHandler = (network: ContributionNetworkSearchResult, shouldPrefillNetworkFields: boolean) => void;

type ContributionSncuIdentificationFieldsProps = {
  hasNoSncuIdentifier: boolean;
  onNetworkClear: () => void;
  onNetworkSelect: ContributionNetworkSelectHandler;
  onNoSncuIdentifierChange: (checked: boolean) => void;
  selectedContributionNetwork: ContributionNetworkSearchResult | null;
  shouldPrefillNetworkFields: boolean;
};

const ContributionSncuIdentificationFields = withFieldGroup<ContributionFormValues, unknown, ContributionSncuIdentificationFieldsProps>({
  defaultValues: contributionDefaultValues,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules.
  render: function ContributionSncuIdentificationFieldsRender({
    group,
    hasNoSncuIdentifier,
    onNetworkClear,
    onNetworkSelect,
    onNoSncuIdentifierChange,
    selectedContributionNetwork,
    shouldPrefillNetworkFields,
  }) {
    return (
      <>
        <group.AppField name="identifiantReseau">
          {(field) => (
            <field.CustomField
              Component={ContributionNetworkSncuField}
              label="Identifiant SNCU du réseau :"
              nativeInputProps={{
                disabled: hasNoSncuIdentifier,
              }}
              onNetworkClear={onNetworkClear}
              onNetworkSelect={(network) => onNetworkSelect(network, shouldPrefillNetworkFields)}
              selectedNetwork={selectedContributionNetwork}
            />
          )}
        </group.AppField>
        <Checkbox
          label="Le réseau n’a pas d’identifiant SNCU"
          className="fr-mb-3w"
          nativeInputProps={{
            checked: hasNoSncuIdentifier,
            name: 'hasNoSncuIdentifier',
            onChange: (event) => onNoSncuIdentifierChange(event.target.checked),
          }}
          small={false}
        />
      </>
    );
  },
});

type ContributionUploadFieldProps = {
  label: string;
  name: 'fichiers' | 'fichiersPDP';
  uploadConfig: ContributionUploadConfig;
};

const ContributionUploadField = withFieldGroup<ContributionFormValues, unknown, ContributionUploadFieldProps>({
  defaultValues: contributionDefaultValues,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules.
  render: function ContributionUploadFieldRender({ group, label, name, uploadConfig }) {
    return (
      <group.AppField name={name} validators={{ onDynamicAsync: uploadConfig.fichiersValidator }}>
        {(field) => (
          <field.UploadField
            className="fr-mb-2w"
            label={label}
            hint={
              <>
                Taille maximale : {formatFileSize(filesLimits.maxFileSize)}. Maximum {filesLimits.maxFiles} fichiers.{' '}
                {uploadConfig.formatsHint}
                <br />
                Pour téléverser plusieurs fichiers, merci de les sélectionner simultanément et non l'un après l'autre.
              </>
            }
            multiple
            nativeInputProps={{ accept: uploadConfig.allowedExtensions.join(',') }}
          />
        )}
      </group.AppField>
    );
  },
});

type ContributionNetworkFieldsProps = Omit<ContributionSncuIdentificationFieldsProps, 'shouldPrefillNetworkFields'> & {
  isSelectedContributionNetworkClassed: boolean;
  withConstructionFields?: boolean;
};

const ContributionNetworkFields = withFieldGroup<ContributionFormValues, unknown, ContributionNetworkFieldsProps>({
  defaultValues: contributionDefaultValues,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules.
  render: function ContributionNetworkFieldsRender({
    group,
    hasNoSncuIdentifier,
    isSelectedContributionNetworkClassed,
    onNetworkClear,
    onNetworkSelect,
    onNoSncuIdentifierChange,
    selectedContributionNetwork,
    withConstructionFields = false,
  }) {
    const ouvertAuxRaccordements = useStore(group.store, (state) => state.values.ouvertAuxRaccordements);
    const reseauDeclasse = useStore(group.store, (state) => state.values.reseauDeclasse);
    const traceUploadLabel =
      isSelectedContributionNetworkClassed && reseauDeclasse !== true ? 'Téléverser le tracé du réseau :' : 'Téléverser vos fichiers :';

    return (
      <>
        <ContributionSncuIdentificationFields
          form={group}
          fields={contributionFormRootFields}
          hasNoSncuIdentifier={hasNoSncuIdentifier}
          onNetworkClear={onNetworkClear}
          onNetworkSelect={onNetworkSelect}
          onNoSncuIdentifierChange={onNoSncuIdentifierChange}
          selectedContributionNetwork={selectedContributionNetwork}
          shouldPrefillNetworkFields
        />
        <group.AppField name="nomReseau">{(field) => <field.TextField label="Nom du réseau :" />}</group.AppField>
        <group.AppField name="localisation">{(field) => <field.TextField label="Localisation :" />}</group.AppField>
        <group.AppField name="gestionnaire">{(field) => <field.TextField label="Gestionnaire :" />}</group.AppField>
        <group.AppField name="maitreOuvrage">{(field) => <field.TextField label="Maître d'ouvrage :" />}</group.AppField>
        {withConstructionFields && (
          <>
            <group.AppField name="dateMiseEnServicePrevisionnelle">
              {(field) => <field.TextField label="Date de mise en service prévisionnelle :" />}
            </group.AppField>
            <group.AppField name="puissanceTotalePrevisionnelleMW">
              {(field) => <field.NumberField label="Puissance totale prévisionnelle (MW) :" nativeInputProps={{ min: 0, step: 'any' }} />}
            </group.AppField>
          </>
        )}
        <group.AppField name="ouvertAuxRaccordements">
          {(field) => <field.BooleanRadioField label="Le réseau est-il ouvert aux raccordements ?" />}
        </group.AppField>
        <group.AppField name="emailReferentCommercial">
          {(field) => (
            <field.TextField
              label="Référent commercial à qui transmettre les demandes de raccordement"
              nativeInputProps={{ required: ouvertAuxRaccordements === true }}
            />
          )}
        </group.AppField>
        <group.AppField name="commentaire">{(field) => <field.TextField label="Commentaire :" />}</group.AppField>
        {isSelectedContributionNetworkClassed && (
          <>
            <CallOut title="Votre réseau est classé" className="fr-mb-3w">
              Nous vous invitons à déposer le périmètre de développement prioritaire ci-dessous pour informer les bâtiments concernés de
              l’obligation d’étude du raccordement.
            </CallOut>
            <group.AppField
              name="reseauDeclasse"
              listeners={{
                onChange: ({ value }) => {
                  if (value === true) {
                    group.setFieldValue('fichiersPDP', undefined, { dontUpdateMeta: true });
                  }
                },
              }}
            >
              {(field) => (
                <field.CheckboxField
                  label={
                    <span>
                      Le réseau a été déclassé par arrêté (si celui-ci n’est pas dans la{' '}
                      <Link
                        href="https://www.ecologie.gouv.fr/politiques-publiques/reseaux-chaleur"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        liste des réseaux déclassés
                      </Link>{' '}
                      et/ou que vous n’avez pas encore transmis votre délibération, merci de l’envoyer à l’adresse
                      Laurent.Cadiou@developpement-durable.gouv.fr)
                    </span>
                  }
                  small={false}
                  className="fr-mb-3w"
                />
              )}
            </group.AppField>
          </>
        )}
        {isSelectedContributionNetworkClassed && reseauDeclasse !== true && (
          <ContributionUploadField
            form={group}
            fields={contributionFormRootFields}
            name="fichiersPDP"
            label="Téléverser le périmètre de développement prioritaire :"
            uploadConfig={optionalPdpUploadConfig}
          />
        )}
        <ContributionUploadField
          form={group}
          fields={contributionFormRootFields}
          name="fichiers"
          label={traceUploadLabel}
          uploadConfig={geoUploadConfig}
        />
      </>
    );
  },
});

type ContributionPriorityPerimeterFieldsProps = Omit<ContributionSncuIdentificationFieldsProps, 'shouldPrefillNetworkFields'>;

const ContributionPriorityPerimeterFields = withFieldGroup<ContributionFormValues, unknown, ContributionPriorityPerimeterFieldsProps>({
  defaultValues: contributionDefaultValues,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules.
  render: function ContributionPriorityPerimeterFieldsRender({
    group,
    hasNoSncuIdentifier,
    onNetworkClear,
    onNetworkSelect,
    onNoSncuIdentifierChange,
    selectedContributionNetwork,
  }) {
    return (
      <>
        <ContributionSncuIdentificationFields
          form={group}
          fields={contributionFormRootFields}
          hasNoSncuIdentifier={hasNoSncuIdentifier}
          onNetworkClear={onNetworkClear}
          onNetworkSelect={onNetworkSelect}
          onNoSncuIdentifierChange={onNoSncuIdentifierChange}
          selectedContributionNetwork={selectedContributionNetwork}
          shouldPrefillNetworkFields={false}
        />
        <group.AppField name="nomReseau">{(field) => <field.TextField label="Nom du réseau :" />}</group.AppField>
        <group.AppField name="localisation">{(field) => <field.TextField label="Localisation :" />}</group.AppField>
        <ContributionUploadField
          form={group}
          fields={contributionFormRootFields}
          name="fichiers"
          label="Téléverser vos fichiers :"
          uploadConfig={geoUploadConfig}
        />
      </>
    );
  },
});

const ContributionMasterPlanFields = withFieldGroup<ContributionFormValues, unknown, Record<never, never>>({
  defaultValues: contributionDefaultValues,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules.
  render: function ContributionMasterPlanFieldsRender({ group }) {
    return (
      <>
        <group.AppField name="nomReseau">{(field) => <field.TextField label="Nom du réseau ou du territoire concerné :" />}</group.AppField>
        <ContributionUploadField
          form={group}
          fields={contributionFormRootFields}
          name="fichiers"
          label="Téléverser vos fichiers :"
          uploadConfig={docUploadConfig}
        />
      </>
    );
  },
});

export default ContributionForm;
