import Alert from '@codegouvfr/react-dsfr/Alert';
import { useStore } from '@tanstack/react-form';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import { postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';
import { nonEmptyArray } from '@/utils/typescript';

import { type ContributionNetworkSearchResult, ContributionNetworkSncuField } from './ContributionNetworkSncuField';

const typesUtilisateur = [
  {
    key: 'Collectivité',
    label: 'une collectivité',
  },
  {
    key: 'Exploitant',
    label: 'un exploitant',
  },
  {
    key: 'Autre',
    label: 'autre',
  },
] as const;

type TypeUtilisateur = (typeof typesUtilisateur)[number]['key'];

const typesDemande = [
  {
    key: 'ajout tracé réseau existant',
    label: 'ajouter le tracé d’un réseau existant',
  },
  {
    key: 'ajout tracé réseau en construction',
    label: 'ajouter le tracé d’un réseau en construction (nouveau réseau ou extension)',
  },
  {
    key: 'ajout périmètre développement prioritaire',
    label: 'ajouter un périmètre de développement prioritaire',
  },
  {
    key: 'ajout schéma directeur',
    label: 'ajouter un schéma directeur',
  },
  {
    key: 'autre',
    label: 'autre',
  },
] as const;

type TypeDemande = (typeof typesDemande)[number]['key'];

const typesDemandeWithSncuIdentification = [
  'ajout tracé réseau existant',
  'ajout tracé réseau en construction',
  'ajout périmètre développement prioritaire',
] as const satisfies readonly TypeDemande[];

export const filesLimits = {
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 10,
  maxTotalFileSize: 250 * 1024 * 1024,
};

export const geoAllowedExtensions = [
  '.geojson',
  '.json',
  '.shp',
  '.shx',
  '.dbf',
  '.prj',
  '.cpg',
  '.qmd',
  '.kml',
  '.kmz',
  '.gpkg',
  '.zip',
  '.pdf',
];

export const docAllowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.zip'];

const requiredShapefileExtensions = ['.shp', '.prj'];

/**
 * Validate file names against allowed extensions and shapefile completeness (.shp + .prj required).
 * Returns an error message if invalid, or null if valid.
 */
const validateFileNames = (fileNames: string[], allowedExtensions: string[]): string | null => {
  // Ensure all files are allowed
  for (const name of fileNames) {
    const ext = `.${name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(ext)) {
      return `L'extension "${ext}" du fichier "${name}" n'est pas autorisée. Extensions acceptées : ${allowedExtensions.join(', ')}.`;
    }
  }

  // Ensure all shapefiles are complete (shp + prj). The name is not checked.
  const extensions = fileNames.map((name) => `.${name.split('.').pop()?.toLowerCase()}`);
  const shapefileExtensions = ['.shp', '.shx', '.dbf', '.prj', '.cpg'];
  if (extensions.some((ext) => shapefileExtensions.includes(ext))) {
    const missing = requiredShapefileExtensions.filter((ext) => !extensions.includes(ext));
    if (missing.length > 0) {
      return `Pour un Shapefile, les fichiers ${requiredShapefileExtensions.join(' et ')} sont requis. Fichier(s) manquant(s) : ${missing.join(', ')}.`;
    }
  }

  return null;
};

// sync checks only — the async zip inspection is validated separately (field level on the
// form, extra superRefine on the API schema) because a form-level async validator flickers
const createFilesSchema = (allowedExtensions: string[]) =>
  z
    .array(z.instanceof(File), { error: 'Veuillez choisir un ou plusieurs fichiers' })
    .refine((files) => files.length <= filesLimits.maxFiles, {
      error: `Vous devez choisir au maximum ${filesLimits.maxFiles} fichiers.`,
    })
    .refine((files) => files.every((file) => file.size <= filesLimits.maxFileSize), {
      error: `Chaque fichier doit être inférieur à ${formatFileSize(filesLimits.maxFileSize)}.`,
    })
    .refine((files) => files.reduce((acc, file) => acc + file.size, 0) <= filesLimits.maxTotalFileSize, {
      error: `Le total des fichier doit être inférieur à ${formatFileSize(filesLimits.maxTotalFileSize)}.`,
    })
    .superRefine((files, ctx) => {
      const directError = validateFileNames(
        files.map((f) => f.name),
        allowedExtensions
      );
      if (directError) {
        ctx.addIssue({ code: 'custom', fatal: true, message: directError });
        return z.NEVER;
      }
    });

/**
 * Async inspection of uploaded .zip archives: their inner file names must match the
 * allowed extensions. Returns an error message, or null when everything is valid.
 * Revalidation re-runs on every change: the inspection is cached per File.
 */
const createZipInspector = (allowedExtensions: string[]) => {
  const zipInspectionCache = new WeakMap<File, string | null>();

  return async (files: File[]): Promise<string | null> => {
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        continue;
      }
      let zipError = zipInspectionCache.get(file);
      if (zipError === undefined) {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const zipFileNames = Object.values(zip.files)
          .filter((entry) => !entry.dir)
          .map((entry) => entry.name.split('/').pop()!);
        zipError = validateFileNames(
          zipFileNames,
          allowedExtensions.filter((e) => e !== '.zip')
        );
        zipInspectionCache.set(file, zipError);
      }
      if (zipError) {
        return `Dans "${file.name}" : ${zipError}`;
      }
    }
    return null;
  };
};

// full validation for the API schema: sync checks + zip inspection in one schema
const createFilesSchemaWithZipInspection = (allowedExtensions: string[]) => {
  const inspectZips = createZipInspector(allowedExtensions);
  return createFilesSchema(allowedExtensions).superRefine(async (files, ctx) => {
    const zipError = await inspectZips(files);
    if (zipError) {
      ctx.addIssue({ code: 'custom', fatal: true, message: zipError });
      return z.NEVER;
    }
  });
};

const stringSchema = z.string({ error: 'Ce champ est obligatoire' });

const sncuIdentificationFieldsShape = {
  identifiantReseau: z.string().optional(),
  reseauSansIdentifiantSNCU: z.boolean().optional(),
};

export const zCommonFormData = z.object({
  dansCadreDemandeADEME: z.boolean({ error: 'Ce choix est obligatoire' }),
  email: z.email("L'adresse email n'est pas valide"),
  nom: z.string({ error: 'Ce champ est obligatoire' }).min(1, 'Ce champ est obligatoire'),
  prenom: z.string({ error: 'Ce champ est obligatoire' }).min(1, 'Ce champ est obligatoire'),
  typeUtilisateur: z.enum(nonEmptyArray(typesUtilisateur.map((w) => w.key)), { error: 'Ce choix est obligatoire' }),
  typeUtilisateurAutre: z.string().optional(),
});

// typeUtilisateurAutre is only required when typeUtilisateur is "Autre".
// when: () => true because zod skips the checks of a schema whose base parse has an
// aborting issue (e.g. a missing required sub-field) — the conditional requirement
// must still be reported alongside the other field errors.
export const isTypeUtilisateurAutreValid = (data: { typeUtilisateur?: string; typeUtilisateurAutre?: string }) =>
  data.typeUtilisateur !== 'Autre' || !!data.typeUtilisateurAutre;
export const typeUtilisateurAutreRefineParams = { message: 'Ce champ est obligatoire', path: ['typeUtilisateurAutre'], when: () => true };

// emailReferentCommercial is only required when the network is open to connections
// (typeDemande, present in every union branch, keeps the structural type compatible)
export const isEmailReferentCommercialValid = (data: {
  typeDemande?: string;
  ouvertAuxRaccordements?: boolean;
  emailReferentCommercial?: string;
}) => !data.ouvertAuxRaccordements || !!data.emailReferentCommercial;
export const emailReferentCommercialRefineParams = {
  message: 'Le référent commercial est obligatoire si le réseau est ouvert aux raccordements',
  path: ['emailReferentCommercial'],
  when: () => true, // see typeUtilisateurAutreRefineParams
};

const isSncuIdentificationRequired = (typeDemande?: string) =>
  typesDemandeWithSncuIdentification.some((sncuTypeDemande) => sncuTypeDemande === typeDemande);

export const isSncuIdentificationValid = (data: {
  identifiantReseau?: string;
  reseauSansIdentifiantSNCU?: boolean;
  typeDemande?: string;
}) => !isSncuIdentificationRequired(data.typeDemande) || !!data.identifiantReseau || data.reseauSansIdentifiantSNCU === true;

export const sncuIdentificationRefineParams = {
  message: "Sélectionnez un identifiant SNCU ou cochez l'absence d'identifiant SNCU",
  path: ['identifiantReseau'],
  when: () => true,
};

// branches are built twice: with the full files schema (API) and with the sync-only one (form)
const createContributionBranches = (filesSchema: typeof createFilesSchema) => {
  // fields shared by the two "tracé de réseau" variants
  const reseauFieldsShape = {
    commentaire: z.string().optional(),
    emailReferentCommercial: z.string().optional(), // conditionally required based on ouvertAuxRaccordements (see refine below)
    fichiers: filesSchema(geoAllowedExtensions),
    fichiersPDP: filesSchema(geoAllowedExtensions).optional(),
    gestionnaire: stringSchema,
    ...sncuIdentificationFieldsShape,
    localisation: stringSchema,
    maitreOuvrage: stringSchema,
    nomReseau: stringSchema,
    ouvertAuxRaccordements: z.boolean({ error: 'Ce choix est obligatoire' }),
    reseauDeclasse: z.boolean().optional(),
  };

  return [
    zCommonFormData.extend({
      typeDemande: z.literal('ajout tracé réseau existant'),
      ...reseauFieldsShape,
    }),
    zCommonFormData.extend({
      typeDemande: z.literal('ajout tracé réseau en construction'),
      ...reseauFieldsShape,
      dateMiseEnServicePrevisionnelle: stringSchema,
      puissanceTotalePrevisionnelleMW: z.number({ error: 'Ce champ est obligatoire' }).positive('La puissance doit être supérieure à 0'),
    }),
    zCommonFormData.extend({
      fichiers: filesSchema(geoAllowedExtensions),
      ...sncuIdentificationFieldsShape,
      localisation: stringSchema,
      nomReseau: stringSchema,
      typeDemande: z.literal('ajout périmètre développement prioritaire'),
    }),
    zCommonFormData.extend({
      fichiers: filesSchema(docAllowedExtensions),
      nomReseau: stringSchema,
      typeDemande: z.literal('ajout schéma directeur'),
    }),
    zCommonFormData.extend({
      precisions: stringSchema,
      typeDemande: z.literal('autre'),
    }),
  ] as const;
};

export const zContributionFormDataBase = z.discriminatedUnion(
  'typeDemande',
  createContributionBranches(createFilesSchemaWithZipInspection),
  // message when no branch matches (invalid typeDemande)
  { error: 'Ce choix est obligatoire' }
);

export const zContributionFormData = zContributionFormDataBase
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams)
  .refine(isSncuIdentificationValid, sncuIdentificationRefineParams);

// flat superset of all branches: the form holds every possible field, the union validates the selected branch
type ContributionFormValues = Omit<z.input<typeof zCommonFormData>, 'dansCadreDemandeADEME' | 'typeUtilisateur'> & {
  dansCadreDemandeADEME?: boolean;
  typeUtilisateur: TypeUtilisateur | '';
  typeDemande: TypeDemande | '';
  commentaire?: string;
  dateMiseEnServicePrevisionnelle?: string;
  emailReferentCommercial?: string;
  fichiers?: File[];
  fichiersPDP?: File[];
  gestionnaire?: string;
  identifiantReseau?: string;
  localisation?: string;
  maitreOuvrage?: string;
  nomReseau?: string;
  ouvertAuxRaccordements?: boolean;
  precisions?: string;
  puissanceTotalePrevisionnelleMW?: number;
  reseauDeclasse?: boolean;
  reseauSansIdentifiantSNCU?: boolean;
};

const contributionDefaultValues: ContributionFormValues = {
  dansCadreDemandeADEME: undefined,
  email: '',
  identifiantReseau: '',
  nom: '',
  prenom: '',
  reseauDeclasse: false,
  reseauSansIdentifiantSNCU: false,
  typeDemande: '',
  typeUtilisateur: '',
  typeUtilisateurAutre: '',
};

// form-side union: sync-only files schemas (the zip inspection runs at the field level),
// plus a branch matching the unselected state (''), so an empty typeDemande still reports
// the common-field errors instead of stopping at the discriminator
const zContributionForm = z
  .discriminatedUnion('typeDemande', [
    ...createContributionBranches(createFilesSchema),
    zCommonFormData.extend({ typeDemande: z.literal('').refine(() => false, { message: 'Ce choix est obligatoire' }) }),
  ])
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  // the union validates the mode-consistent runtime values; unify its type for TanStack
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams)
  .refine(isSncuIdentificationValid, sncuIdentificationRefineParams) as unknown as z.ZodType<
  ContributionFormValues,
  ContributionFormValues
>;

// the async zip inspection runs as a field-level validator: it only concerns the
// fichiers field, and a form-level async validator would flicker (an aborted debounced
// run clears every form-level error until the next run rewrites them). It runs the FULL
// files schema (sync checks + zip inspection), not just the async part: sync and async
// results share the same error-map slot, so returning undefined would erase the sync
// error written by the form schema (e.g. a wrong extension) right after each submit.
const createFichiersFieldValidator = (allowedExtensions: string[], options: { required?: boolean } = {}) => {
  const schema =
    options.required === false
      ? createFilesSchemaWithZipInspection(allowedExtensions).optional()
      : createFilesSchemaWithZipInspection(allowedExtensions);
  return async ({ value }: { value: File[] | undefined }) => {
    const result = await schema.safeParseAsync(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };
};
const geoFichiersValidator = createFichiersFieldValidator(geoAllowedExtensions);
const optionalGeoFichiersValidator = createFichiersFieldValidator(geoAllowedExtensions, { required: false });
const docFichiersValidator = createFichiersFieldValidator(docAllowedExtensions);

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
const ContributionForm = () => {
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

  // plain render helpers (not components) shared by the demand type branches
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
          {/* only rendered when "autre" is selected, where it is expected to be filled */}
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

      <form.AppField name="typeDemande">
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
};

export default ContributionForm;
