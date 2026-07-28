import Alert from '@codegouvfr/react-dsfr/Alert';
import { useStore } from '@tanstack/react-form';
import Link from 'next/link';
import { useState } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import { postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';

import { type ContributionNetworkSearchResult, ContributionNetworkSncuField } from './ContributionNetworkSncuField';
import {
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

/**
 * Public contribution form: network managers/collectivités submit geo data
 * (network traces, priority perimeters, master plans) with file uploads.
 * The fields depend on the selected demand type (discriminated union schema).
 */
function ContributionForm() {
  const [formSuccess, setFormSuccess] = useState(false);
  const [selectedContributionNetwork, setSelectedContributionNetwork] = useState<ContributionNetworkSearchResult | null>(null);

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
  const ouvertAuxRaccordements = useStore(form.store, (state) => state.values.ouvertAuxRaccordements);
  const reseauSansIdentifiantSNCU = useStore(form.store, (state) => state.values.reseauSansIdentifiantSNCU);
  const reseauDeclasse = useStore(form.store, (state) => state.values.reseauDeclasse);
  const isSelectedContributionNetworkClassed = selectedContributionNetwork?.is_classe === true;

  const resetClassedNetworkFields = () => {
    form.setFieldValue('reseauDeclasse', false, { dontUpdateMeta: true });
    form.setFieldValue('fichiersPDP', undefined, { dontUpdateMeta: true });
  };

  const resetSncuIdentificationFields = () => {
    setSelectedContributionNetwork(null);
    form.setFieldValue('identifiantReseau', '', { dontUpdateMeta: true });
    form.setFieldValue('reseauSansIdentifiantSNCU', false, { dontUpdateMeta: true });
    resetClassedNetworkFields();
  };

  const resetTypeDemandeDependentFields = () => {
    resetSncuIdentificationFields();
    form.setFieldValue('commentaire', '', { dontUpdateMeta: true });
    form.setFieldValue('dateMiseEnServicePrevisionnelle', '', { dontUpdateMeta: true });
    form.setFieldValue('emailReferentCommercial', '', { dontUpdateMeta: true });
    form.setFieldValue('fichiers', undefined, { dontUpdateMeta: true });
    form.setFieldValue('gestionnaire', '', { dontUpdateMeta: true });
    form.setFieldValue('localisation', '', { dontUpdateMeta: true });
    form.setFieldValue('maitreOuvrage', '', { dontUpdateMeta: true });
    form.setFieldValue('nomReseau', '', { dontUpdateMeta: true });
    form.setFieldValue('ouvertAuxRaccordements', undefined, { dontUpdateMeta: true });
    form.setFieldValue('precisions', '', { dontUpdateMeta: true });
    form.setFieldValue('puissanceTotalePrevisionnelleMW', undefined, { dontUpdateMeta: true });
  };

  const handleContributionNetworkClear = () => {
    setSelectedContributionNetwork(null);
    form.setFieldValue('identifiantReseau', '');
    resetClassedNetworkFields();
  };

  const handleContributionNetworkSelect = (network: ContributionNetworkSearchResult, shouldPrefillNetworkFields: boolean) => {
    setSelectedContributionNetwork(network);
    form.setFieldValue('reseauSansIdentifiantSNCU', false, { dontUpdateMeta: true });
    resetClassedNetworkFields();

    if (!shouldPrefillNetworkFields) {
      return;
    }

    form.setFieldValue('nomReseau', network.nom_reseau ?? '');
    form.setFieldValue('localisation', network.localisation ?? '');
    form.setFieldValue('gestionnaire', network.gestionnaire ?? '');
    form.setFieldValue('maitreOuvrage', network.maitre_ouvrage ?? '');
  };

  const renderNomReseauField = (label: string) => (
    <form.AppField name="nomReseau">{(field) => <field.TextField label={label} />}</form.AppField>
  );

  const renderLocalisationField = () => (
    <form.AppField name="localisation">{(field) => <field.TextField label="Localisation :" />}</form.AppField>
  );

  const renderFichiersField = (
    name: 'fichiers' | 'fichiersPDP',
    label: string,
    allowedExtensions: string[],
    fichiersValidator: typeof geoFichiersValidator,
    formatsHint: string
  ) => (
    <form.AppField name={name} validators={{ onDynamicAsync: fichiersValidator }}>
      {(field) => (
        <field.UploadField
          className="fr-mb-2w"
          label={label}
          hint={
            <>
              Taille maximale : {formatFileSize(filesLimits.maxFileSize)}. Maximum {filesLimits.maxFiles} fichiers. {formatsHint}
              <br />
              Pour téléverser plusieurs fichiers, merci de les sélectionner simultanément et non l'un après l'autre.
            </>
          }
          multiple
          nativeInputProps={{ accept: allowedExtensions.join(',') }}
        />
      )}
    </form.AppField>
  );

  const renderSncuIdentificationFields = (shouldPrefillNetworkFields: boolean) => (
    <>
      <form.AppField name="identifiantReseau">
        {(field) => (
          <field.CustomField
            Component={ContributionNetworkSncuField}
            label="Identifiant SNCU du réseau :"
            hintText="Sélectionnez un identifiant dans la liste de suggestions."
            nativeInputProps={{
              disabled: reseauSansIdentifiantSNCU === true,
              required: reseauSansIdentifiantSNCU !== true,
            }}
            onNetworkClear={handleContributionNetworkClear}
            onNetworkSelect={(network) => handleContributionNetworkSelect(network, shouldPrefillNetworkFields)}
            selectedNetwork={selectedContributionNetwork}
          />
        )}
      </form.AppField>
      <form.AppField
        name="reseauSansIdentifiantSNCU"
        listeners={{
          onChange: ({ value }) => {
            if (value === true) {
              handleContributionNetworkClear();
            }
          },
        }}
      >
        {(field) => <field.CheckboxField label="Le réseau n’a pas d’identifiant SNCU" small={false} className="fr-mb-3w" />}
      </form.AppField>
    </>
  );

  const renderClassedNetworkFields = () => (
    <>
      {isSelectedContributionNetworkClassed && (
        <>
          <Alert
            severity="info"
            title="Votre réseau est classé."
            description="Nous vous invitons à déposer le périmètre de développement prioritaire ci-dessous pour informer les bâtiments concernés de l’obligation d’étude du raccordement."
            className="fr-mb-3w"
            small
          />
          <form.AppField
            name="reseauDeclasse"
            listeners={{
              onChange: ({ value }) => {
                if (value === true) {
                  form.setFieldValue('fichiersPDP', undefined, { dontUpdateMeta: true });
                }
              },
            }}
          >
            {(field) => (
              <field.CheckboxField
                label="Le réseau a été déclassé par arrêté (si celui-ci n’est pas dans la liste des réseaux déclassés et/ou que vous n’avez pas encore transmis votre délibération, merci de l’envoyer à l’adresse Laurent.Cadiou@developpement-durable.gouv.fr)"
                small={false}
                className="fr-mb-3w"
              />
            )}
          </form.AppField>
        </>
      )}
      {isSelectedContributionNetworkClassed &&
        reseauDeclasse !== true &&
        renderFichiersField(
          'fichiersPDP',
          'Téléverser le périmètre de développement prioritaire :',
          geoAllowedExtensions,
          optionalGeoFichiersValidator,
          'Formats préférentiels : GeoJSON, Shapefile (au moins shp + prj), KML, GeoPackage.'
        )}
    </>
  );

  const renderReseauFields = (withDateMiseEnService: boolean) => (
    <>
      {renderSncuIdentificationFields(true)}
      {renderNomReseauField('Nom du réseau :')}
      {renderLocalisationField()}
      <form.AppField name="gestionnaire">{(field) => <field.TextField label="Gestionnaire :" />}</form.AppField>
      <form.AppField name="maitreOuvrage">{(field) => <field.TextField label="Maître d'ouvrage :" />}</form.AppField>
      {withDateMiseEnService && (
        <>
          <form.AppField name="dateMiseEnServicePrevisionnelle">
            {(field) => <field.TextField label="Date de mise en service prévisionnelle :" />}
          </form.AppField>
          <form.AppField name="puissanceTotalePrevisionnelleMW">
            {(field) => <field.NumberField label="Puissance totale prévisionnelle (MW) :" nativeInputProps={{ min: 0, step: 'any' }} />}
          </form.AppField>
        </>
      )}
      <form.AppField name="ouvertAuxRaccordements">
        {(field) => <field.BooleanRadioField label="Le réseau est-il ouvert aux raccordements ?" />}
      </form.AppField>
      <form.AppField name="emailReferentCommercial">
        {(field) => (
          <field.TextField
            label="Référent commercial à qui transmettre les demandes de raccordement"
            nativeInputProps={{ required: ouvertAuxRaccordements === true }}
          />
        )}
      </form.AppField>
      <form.AppField name="commentaire">{(field) => <field.TextField label="Commentaire :" />}</form.AppField>
      {renderClassedNetworkFields()}
      {renderFichiersField(
        'fichiers',
        isSelectedContributionNetworkClassed && reseauDeclasse !== true ? 'Téléverser le tracé du réseau :' : 'Téléverser vos fichiers :',
        geoAllowedExtensions,
        geoFichiersValidator,
        'Formats préférentiels : GeoJSON, Shapefile (au moins shp + prj), KML, GeoPackage.'
      )}
    </>
  );

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

      {typeDemande === 'ajout tracé réseau existant' && renderReseauFields(false)}
      {typeDemande === 'ajout tracé réseau en construction' && renderReseauFields(true)}
      {typeDemande === 'ajout périmètre développement prioritaire' && (
        <>
          {renderSncuIdentificationFields(false)}
          {renderNomReseauField('Nom du réseau :')}
          {renderLocalisationField()}
          {renderFichiersField(
            'fichiers',
            'Téléverser vos fichiers :',
            geoAllowedExtensions,
            geoFichiersValidator,
            'Formats préférentiels : GeoJSON, Shapefile (au moins shp + prj), KML, GeoPackage.'
          )}
        </>
      )}
      {typeDemande === 'ajout schéma directeur' && (
        <>
          {renderNomReseauField('Nom du réseau ou du territoire concerné :')}
          {renderFichiersField(
            'fichiers',
            'Téléverser vos fichiers :',
            docAllowedExtensions,
            docFichiersValidator,
            'Formats préférentiels : PDF, Word.'
          )}
        </>
      )}
      {typeDemande === 'autre' && <form.AppField name="precisions">{(field) => <field.TextField label="Précisez :" />}</form.AppField>}

      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

export default ContributionForm;
