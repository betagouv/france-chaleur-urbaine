import formidable from 'formidable';
import { z } from 'zod';

import { filesLimits, riskyExtensions, zContributionFormData } from '@/components/ContributionForm/ContributionForm';
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

const serverSideFilesSchema = z
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
    files.forEach((file) => {
      if (riskyExtensions.some((extension) => file.originalFilename.endsWith(extension))) {
        ctx.addIssue({
          code: 'custom',
          message: `L'extension du fichier "${file.originalFilename}" n'est pas autorisée.`,
          fatal: true,
        });
        return z.NEVER;
      }
    });
  })
  .optional();

// updated schema with new server side files validation
const zServerContributionFormData = z.discriminatedUnion(
  'typeDemande',
  nonEmptyArray(
    zContributionFormData.options.map((schema) =>
      schema.extend({
        fichiers: serverSideFilesSchema,
      })
    )
  )
);

const contributionRateLimiter = createNextApiRateLimiter({ path: '/api/contribution' });

export default handleRouteErrors(async (req, res) => {
  requirePostMethod(req);
  await contributionRateLimiter(req, res);

  const [arrayFields, files] = await formidable(filesLimits).parse(req);
  const fields = flattenMultipartData(arrayFields);
  const formValues = await zServerContributionFormData.parseAsync({ ...fields, fichiers: files.fichiers });

  const record = await AirtableDB('FCU - Contribution').create({
    Utilisateur: formValues.typeUtilisateur === 'Autre' ? formValues.typeUtilisateurAutre : formValues.typeUtilisateur,
    Nom: formValues.nom,
    Prénom: formValues.prenom,
    Email: formValues.email,
    'Cadre subvention ADEME': formValues.dansCadreDemandeADEME,
    Souhait: formValues.typeDemande,
    'Réseau(x)': (formValues as any).nomReseau,
    Localisation: (formValues as any).localisation,
    'Nom gestionnaire': (formValues as any).gestionnaire,
    'Date mise en service': (formValues as any).dateMiseEnServicePrevisionnelle,
    'Référent commercial': (formValues as any).emailReferentCommercial,
    Précisions: (formValues as any).precisions ?? (formValues as any).commentaire,
    Fichiers: await Promise.all(
      (files.fichiers ?? []).map(async (fichier, index) => {
        const externalURL = await uploadTempFile(fichier.filepath, fichier.originalFilename ?? `Fichier ${index + 1}`);
        return {
          filename: fichier.originalFilename ?? `Fichier ${index + 1}`,
          url: externalURL,
        } as any; // bypass wrong typing
      })
    ),
  });

  logger.info('create airtable record contribution', {
    id: record.id,
  });
});
