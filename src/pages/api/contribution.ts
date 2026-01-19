import formidable from 'formidable';
import { z } from 'zod';

import { filesLimits, riskyExtensions, zContributionFormDataBase } from '@/components/ContributionForm/ContributionForm';
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
          fatal: true,
          message: `L'extension du fichier "${file.originalFilename}" n'est pas autorisée.`,
        });
        return z.NEVER;
      }
    });
  })
  .optional();

// updated schema with new server side files validation
const zServerContributionFormData = z
  .discriminatedUnion(
    'typeDemande',
    nonEmptyArray(
      zContributionFormDataBase.options.map((schema) =>
        schema.extend({
          fichiers: serverSideFilesSchema,
        })
      )
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
