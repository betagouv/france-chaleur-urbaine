import { readFile } from 'node:fs/promises';

import formidable from 'formidable';
import JSZip from 'jszip';
import { z } from 'zod';

import {
  docAllowedExtensions,
  filesLimits,
  geoAllowedExtensions,
  zContributionFormDataBase,
} from '@/components/ContributionForm/ContributionForm';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { AirtableDB } from '@/server/db/airtable';
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
        mimetype: z.string(),
        originalFilename: z.string(),
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
        const ext = `.${file.originalFilename.split('.').pop()?.toLowerCase()}`;
        if (!allowedExtensions.includes(ext)) {
          ctx.addIssue({
            code: 'custom',
            fatal: true,
            message: `L'extension "${ext}" du fichier "${file.originalFilename}" n'est pas autorisée. Extensions acceptées : ${allowedExtensions.join(', ')}.`,
          });
          return z.NEVER;
        }
      }
    })
    .superRefine(async (files, ctx) => {
      for (const file of files) {
        if (file.originalFilename.toLowerCase().endsWith('.zip')) {
          const buffer = await readFile(file.filepath);
          const zip = await JSZip.loadAsync(buffer);
          const zipFileNames = Object.keys(zip.files);
          const allowedInZip = allowedExtensions.filter((e) => e !== '.zip');
          const hasRelevantFile = zipFileNames.some((name) => allowedInZip.some((ext) => name.toLowerCase().endsWith(ext)));
          if (!hasRelevantFile) {
            ctx.addIssue({
              code: 'custom',
              fatal: true,
              message: `Le fichier ZIP "${file.originalFilename}" ne contient aucun fichier avec une extension autorisée (${allowedInZip.join(', ')}).`,
            });
            return z.NEVER;
          }
        }
      }
    })
    .optional();

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
        });
      })
    )
  )
  .refine(
    (data: Record<string, unknown>) => {
      if (!data.ouvertAuxRaccordements) return true;
      return typeof data.emailReferentCommercial === 'string' && data.emailReferentCommercial.length > 0;
    },
    {
      message: 'Le référent commercial est obligatoire si le réseau est ouvert aux raccordements',
      path: ['emailReferentCommercial'],
    }
  );

const contributionRateLimiter = createNextApiRateLimiter({ path: '/api/contribution' });

export default handleRouteErrors(async (req, res) => {
  requirePostMethod(req);
  await contributionRateLimiter(req, res);

  const [arrayFields, files] = await formidable(filesLimits).parse(req);
  const fields = flattenMultipartData(arrayFields);
  const formValues = await zServerContributionFormData.parseAsync({ ...fields, fichiers: files.fichiers });

  const record = await AirtableDB('FCU - Contribution').create({
    'Cadre subvention ADEME': formValues.dansCadreDemandeADEME,
    'Date mise en service': (formValues as any).dateMiseEnServicePrevisionnelle,
    Email: formValues.email,
    Fichiers: await Promise.all(
      (files.fichiers ?? []).map(async (fichier, index) => {
        const externalURL = await uploadTempFile(fichier.filepath, fichier.originalFilename ?? `Fichier ${index + 1}`);
        return {
          filename: fichier.originalFilename ?? `Fichier ${index + 1}`,
          url: externalURL,
        } as any; // bypass wrong typing
      })
    ),
    Localisation: (formValues as any).localisation,
    Nom: formValues.nom,
    'Nom gestionnaire': (formValues as any).gestionnaire,
    ouvert_aux_raccordements: (formValues as any).ouvertAuxRaccordements,
    Précisions: (formValues as any).precisions ?? (formValues as any).commentaire,
    Prénom: formValues.prenom,
    'Référent commercial': (formValues as any).emailReferentCommercial,
    'Réseau(x)': (formValues as any).nomReseau,
    Souhait: formValues.typeDemande,
    Utilisateur: formValues.typeUtilisateur === 'Autre' ? formValues.typeUtilisateurAutre : formValues.typeUtilisateur,
  });

  logger.info('create airtable record contribution', {
    id: record.id,
  });
});
