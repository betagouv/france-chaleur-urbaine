import { readFile } from 'node:fs/promises';

import formidable from 'formidable';
import JSZip from 'jszip';
import { z } from 'zod';

import {
  docAllowedExtensions,
  emailReferentCommercialRefineParams,
  filesLimits,
  geoAllowedExtensions,
  isEmailReferentCommercialValid,
  isTypeUtilisateurAutreValid,
  type TypeDemande,
  typeUtilisateurAutreRefineParams,
  validateFileNames,
  zContributionFormDataBase,
} from '@/components/ContributionForm/schema';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { AirtableDB, type FieldSet } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { uploadTempFile } from '@/server/services/upload';
import { flattenMultipartData } from '@/utils/form-utils';
import { formatFileSize } from '@/utils/strings';
import { isNonEmptyString, nonEmptyArray } from '@/utils/typescript';

export const config = {
  api: {
    bodyParser: false, // disable because formidable handles all the parsing
  },
};

const zServerFile = z.object({
  filepath: z.string(),
  mimetype: z.string().nullable(),
  originalFilename: z.string().nullable(),
  size: z.number(),
});

type ServerFile = z.infer<typeof zServerFile>;

const createServerFilesSchema = (allowedExtensions: string[], options: { required?: boolean } = {}) => {
  const schema = z
    .array(zServerFile, { error: 'Veuillez choisir un ou plusieurs fichiers' })
    .min(1, { error: 'Veuillez choisir un ou plusieurs fichiers' })
    .refine((files) => files.length <= filesLimits.maxFiles, {
      error: `Vous devez choisir au maximum ${filesLimits.maxFiles} fichiers.`,
    })
    .refine((files) => files.every((file) => file.size <= filesLimits.maxFileSize), {
      error: `Chaque fichier doit être inférieur à ${formatFileSize(filesLimits.maxFileSize)}.`,
    })
    .refine((files) => files.reduce((acc, file) => acc + file.size, 0) <= filesLimits.maxTotalFileSize, {
      error: `Le total des fichier doit être inférieur à ${formatFileSize(filesLimits.maxTotalFileSize)}.`,
    })
    .superRefine((files, context) => {
      const directError = validateFileNames(files.map(getServerFileName), allowedExtensions);
      if (directError) {
        context.addIssue({ code: 'custom', fatal: true, message: directError });
        return z.NEVER;
      }
    })
    .superRefine(async (files, context) => {
      const zipErrors = await Promise.all(files.map((file) => inspectServerZipFile(file, allowedExtensions)));
      const zipError = zipErrors.find(isNonEmptyString);
      if (zipError) {
        context.addIssue({ code: 'custom', fatal: true, message: zipError });
        return z.NEVER;
      }
    });

  return options.required === false ? schema.optional() : schema;
};

const parseMultipartNumber = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : Number(trimmedValue.replace(',', '.'));
};

const positiveMultipartNumberSchema = z.preprocess(
  parseMultipartNumber,
  z.number({ error: 'Ce champ est obligatoire' }).positive('La puissance doit être supérieure à 0')
);

type ContributionFormBranch = (typeof zContributionFormDataBase.options)[number];

const zServerContributionFormData = z
  .discriminatedUnion('typeDemande', nonEmptyArray(zContributionFormDataBase.options.map(createServerContributionBranch)))
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams);

type ServerContributionFormData = z.infer<typeof zServerContributionFormData>;

const contributionRateLimiter = createNextApiRateLimiter({ path: '/api/contribution' });

export default handleRouteErrors(async (req, res) => {
  requirePostMethod(req);
  await contributionRateLimiter(req, res);

  const [arrayFields, files] = await formidable(filesLimits).parse(req);
  const fields = flattenMultipartData(arrayFields);
  const formValues = await zServerContributionFormData.parseAsync({
    ...fields,
    fichiers: files.fichiers,
    fichiersPDP: files.fichiersPDP,
  });

  const [traceAttachments, pdpAttachments] = await Promise.all([
    uploadAirtableFiles(files.fichiers, 'Tracé'),
    uploadAirtableFiles(files.fichiersPDP, 'PDP'),
  ]);

  const airtableRecord: FieldSet = {
    'Cadre subvention ADEME': formValues.dansCadreDemandeADEME,
    'Date mise en service':
      formValues.typeDemande === 'ajout tracé réseau en construction' ? formValues.dateMiseEnServicePrevisionnelle : undefined,
    Email: formValues.email,
    Fichiers: [...traceAttachments, ...pdpAttachments] as unknown as FieldSet[string],
    'ID SNCU': 'identifiantReseau' in formValues ? formValues.identifiantReseau : undefined,
    Localisation: 'localisation' in formValues ? formValues.localisation : undefined,
    "Maître d'ouvrage": 'maitreOuvrage' in formValues ? formValues.maitreOuvrage : undefined,
    Nom: formValues.nom,
    'Nom gestionnaire': 'gestionnaire' in formValues ? formValues.gestionnaire : undefined,
    ouvert_aux_raccordements: 'ouvertAuxRaccordements' in formValues ? formValues.ouvertAuxRaccordements : undefined,
    Précisions: getContributionPrecisions(formValues),
    Prénom: formValues.prenom,
    'Puissance totale prévisionnelle (MW)':
      formValues.typeDemande === 'ajout tracé réseau en construction' ? formValues.puissanceTotalePrevisionnelleMW : undefined,
    'Référent commercial': 'emailReferentCommercial' in formValues ? formValues.emailReferentCommercial : undefined,
    'Réseau déclassé': 'reseauDeclasse' in formValues ? formValues.reseauDeclasse === true : undefined,
    'Réseau(x)': 'nomReseau' in formValues ? formValues.nomReseau : undefined,
    Souhait: formValues.typeDemande,
    Utilisateur: formValues.typeUtilisateur === 'Autre' ? formValues.typeUtilisateurAutre : formValues.typeUtilisateur,
  };

  const record = await AirtableDB('FCU - Contribution').create(airtableRecord);

  logger.info('create airtable record contribution', {
    id: record.id,
  });
});

function createServerContributionBranch(schema: ContributionFormBranch) {
  const typeDemande = schema.shape.typeDemande._def.values[0] as TypeDemande;

  switch (typeDemande) {
    case 'ajout tracé réseau existant':
      return schema.extend({
        fichiers: createServerFilesSchema(geoAllowedExtensions),
        fichiersPDP: createServerFilesSchema(geoAllowedExtensions, { required: false }),
      });
    case 'ajout tracé réseau en construction':
      return schema.extend({
        fichiers: createServerFilesSchema(geoAllowedExtensions),
        fichiersPDP: createServerFilesSchema(geoAllowedExtensions, { required: false }),
        puissanceTotalePrevisionnelleMW: positiveMultipartNumberSchema,
      });
    case 'ajout périmètre développement prioritaire':
      return schema.extend({
        fichiers: createServerFilesSchema(geoAllowedExtensions),
      });
    case 'ajout schéma directeur':
      return schema.extend({
        fichiers: createServerFilesSchema(docAllowedExtensions),
      });
    case 'autre':
      return schema;
  }
}

const uploadAirtableFiles = (files: ServerFile[] | undefined, label: string) =>
  Promise.all(
    (files ?? []).map(async (file, fileIndex) => {
      const filename = file.originalFilename ?? `${label} ${fileIndex + 1}`;
      const externalURL = await uploadTempFile(file.filepath, filename);
      return { filename, url: externalURL };
    })
  );

const inspectServerZipFile = async (file: ServerFile, allowedExtensions: string[]) => {
  const filename = getServerFileName(file);
  if (!filename.toLowerCase().endsWith('.zip')) {
    return null;
  }

  const buffer = await readFile(file.filepath);
  const zip = await JSZip.loadAsync(buffer);
  const zipFileNames = Object.values(zip.files)
    .filter((zipFile) => !zipFile.dir)
    .map((zipFile) => zipFile.name.split('/').pop())
    .filter(isNonEmptyString);
  const zipError = validateFileNames(
    zipFileNames,
    allowedExtensions.filter((extension) => extension !== '.zip')
  );

  return zipError ? `Dans "${filename}" : ${zipError}` : null;
};

const getContributionPrecisions = (formValues: ServerContributionFormData) =>
  [formValues.typeDemande === 'autre' ? formValues.precisions : undefined, 'commentaire' in formValues ? formValues.commentaire : undefined]
    .filter(isNonEmptyString)
    .join('\n');

const getServerFileName = (file: ServerFile) => file.originalFilename ?? '';
