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
  isSncuIdentificationValid,
  isTypeUtilisateurAutreValid,
  sncuIdentificationRefineParams,
  typeUtilisateurAutreRefineParams,
  zContributionFormDataBase,
} from '@/components/ContributionForm/ContributionForm';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { AirtableDB, type FieldSet } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { uploadTempFile } from '@/server/services/upload';
import { flattenMultipartData } from '@/utils/form-utils';
import { formatFileSize } from '@/utils/strings';
import { nonEmptyArray } from '@/utils/typescript';

export const config = {
  api: {
    bodyParser: false, // disable because formidable handles all the parsing
  },
};

const createServerFilesSchema = (allowedExtensions: string[]) =>
  z
    .array(
      // formidable.File
      z.object({
        filepath: z.string(),
        mimetype: z.string().nullable(),
        originalFilename: z.string().nullable(),
        size: z.number(),
      })
    )
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
      for (const file of files) {
        const fileName = file.originalFilename ?? '';
        const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
        if (!allowedExtensions.includes(ext)) {
          ctx.addIssue({
            code: 'custom',
            fatal: true,
            message: `L'extension "${ext}" du fichier "${fileName}" n'est pas autorisée. Extensions acceptées : ${allowedExtensions.join(', ')}.`,
          });
          return z.NEVER;
        }
      }
    })
    .superRefine(async (files, ctx) => {
      for (const file of files) {
        const fileName = file.originalFilename ?? '';
        if (fileName.toLowerCase().endsWith('.zip')) {
          const buffer = await readFile(file.filepath);
          const zip = await JSZip.loadAsync(buffer);
          const zipFileNames = Object.keys(zip.files);
          const allowedInZip = allowedExtensions.filter((e) => e !== '.zip');
          const hasRelevantFile = zipFileNames.some((name) => allowedInZip.some((ext) => name.toLowerCase().endsWith(ext)));
          if (!hasRelevantFile) {
            ctx.addIssue({
              code: 'custom',
              fatal: true,
              message: `Le fichier ZIP "${fileName}" ne contient aucun fichier avec une extension autorisée (${allowedInZip.join(', ')}).`,
            });
            return z.NEVER;
          }
        }
      }
    })
    .optional();

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

const optionalPositiveMultipartNumberSchema = z.preprocess(
  parseMultipartNumber,
  z.number().positive('La puissance doit être supérieure à 0').optional()
);

// mapping from typeDemande discriminator values to their allowed extensions
const allowedExtensionsByTypeDemande: Record<string, string[]> = {
  'ajout périmètre développement prioritaire': geoAllowedExtensions,
  'ajout schéma directeur': docAllowedExtensions,
  'ajout tracé réseau en construction': geoAllowedExtensions,
  'ajout tracé réseau existant': geoAllowedExtensions,
  autre: geoAllowedExtensions, // fallback, "autre" has no file field but schema expects optional
};

// build the discriminated union with per-typeDemande file schemas
const zServerContributionFormData = z
  .discriminatedUnion(
    'typeDemande',
    nonEmptyArray(
      zContributionFormDataBase.options.map((schema) => {
        const typeDemande = schema.shape.typeDemande._def.values[0] as string;
        const extensions = allowedExtensionsByTypeDemande[typeDemande] ?? geoAllowedExtensions;
        return schema.extend({
          fichiers: createServerFilesSchema(extensions),
          fichiersPDP: createServerFilesSchema(geoAllowedExtensions),
          puissanceTotalePrevisionnelleMW:
            typeDemande === 'ajout tracé réseau en construction' ? positiveMultipartNumberSchema : optionalPositiveMultipartNumberSchema,
        });
      })
    )
  )
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams)
  .refine(isSncuIdentificationValid, sncuIdentificationRefineParams);

const contributionRateLimiter = createNextApiRateLimiter({ path: '/api/contribution' });

type ServerContributionFormData = z.infer<typeof zServerContributionFormData>;
type UploadedContributionFile = {
  filepath: string;
  originalFilename: string | null;
};
type AirtableUploadAttachment = {
  filename: string;
  url: string;
};

const uploadAirtableFiles = async (files: UploadedContributionFile[] | undefined, label: string): Promise<AirtableUploadAttachment[]> => {
  return await Promise.all(
    (files ?? []).map(async (file, index) => {
      const originalFilename = file.originalFilename ?? `Fichier ${index + 1}`;
      const externalURL = await uploadTempFile(file.filepath, originalFilename);
      return {
        filename: `${label} - ${originalFilename}`,
        url: externalURL,
      };
    })
  );
};

const buildAirtablePrecisions = (formValues: ServerContributionFormData): string | undefined => {
  const userText = 'precisions' in formValues ? formValues.precisions : 'commentaire' in formValues ? formValues.commentaire : undefined;

  const collectedDetails = [
    'identifiantReseau' in formValues
      ? formValues.identifiantReseau
        ? `Identifiant SNCU : ${formValues.identifiantReseau}`
        : formValues.reseauSansIdentifiantSNCU === true
          ? 'Identifiant SNCU : aucun'
          : undefined
      : undefined,
    'reseauDeclasse' in formValues && formValues.reseauDeclasse === true ? 'Réseau déclaré déclassé par arrêté : oui' : undefined,
    'puissanceTotalePrevisionnelleMW' in formValues && formValues.puissanceTotalePrevisionnelleMW !== undefined
      ? `Puissance totale prévisionnelle : ${formValues.puissanceTotalePrevisionnelleMW} MW`
      : undefined,
  ].filter(isNonEmptyString);

  const collectedText =
    collectedDetails.length > 0 ? ['Informations collectées par le formulaire :', ...collectedDetails].join('\n') : undefined;

  return [userText, collectedText].filter(isNonEmptyString).join('\n\n') || undefined;
};

const isNonEmptyString = (value: string | undefined): value is string => Boolean(value);

export default handleRouteErrors(async (req, res) => {
  requirePostMethod(req);
  await contributionRateLimiter(req, res);

  const [arrayFields, files] = await formidable(filesLimits).parse(req);
  const fields = flattenMultipartData(arrayFields);
  const formValues = await zServerContributionFormData.parseAsync({ ...fields, fichiers: files.fichiers, fichiersPDP: files.fichiersPDP });
  const [traceAttachments, pdpAttachments] = await Promise.all([
    uploadAirtableFiles(files.fichiers, 'Tracé'),
    uploadAirtableFiles(files.fichiersPDP, 'PDP'),
  ]);

  const airtableRecord: FieldSet = {
    'Cadre subvention ADEME': formValues.dansCadreDemandeADEME,
    'Date mise en service': 'dateMiseEnServicePrevisionnelle' in formValues ? formValues.dateMiseEnServicePrevisionnelle : undefined,
    Email: formValues.email,
    Fichiers: [...traceAttachments, ...pdpAttachments] as unknown as FieldSet[string],
    Localisation: 'localisation' in formValues ? formValues.localisation : undefined,
    "Maître d'ouvrage": 'maitreOuvrage' in formValues ? formValues.maitreOuvrage : undefined,
    Nom: formValues.nom,
    'Nom gestionnaire': 'gestionnaire' in formValues ? formValues.gestionnaire : undefined,
    ouvert_aux_raccordements: 'ouvertAuxRaccordements' in formValues ? formValues.ouvertAuxRaccordements : undefined,
    Précisions: buildAirtablePrecisions(formValues),
    Prénom: formValues.prenom,
    'Référent commercial': 'emailReferentCommercial' in formValues ? formValues.emailReferentCommercial : undefined,
    'Réseau(x)': 'nomReseau' in formValues ? formValues.nomReseau : undefined,
    Souhait: formValues.typeDemande,
    Utilisateur: formValues.typeUtilisateur === 'Autre' ? formValues.typeUtilisateurAutre : formValues.typeUtilisateur,
  };

  const record = await AirtableDB('FCU - Contribution').create(airtableRecord);

  logger.info('create airtable record contribution', {
    id: record.id,
  });
});
