import { z } from 'zod';

import { type AllowedFileExtension, allowedFileTypes, fileUploadLimits } from '@/modules/files/constants';
import type { networkChangeRequestContactTypes, networkChangeRequestKinds } from '@/modules/network-change-requests/constants';
import { formatFileSize } from '@/utils/strings';
import { nonEmptyArray, ObjectEntries } from '@/utils/typescript';

export const typesUtilisateur = [
  { key: 'collectivite', label: 'une collectivité' },
  { key: 'exploitant', label: 'un exploitant' },
  { key: 'autre', label: 'autre' },
] as const satisfies readonly { key: (typeof networkChangeRequestContactTypes)[number]; label: string }[];

export type TypeUtilisateur = (typeof typesUtilisateur)[number]['key'];

/** Kinds proposed by the contribution form (the page modification has its own form: /reseaux/modifier). */
export const typesDemande = [
  { key: 'trace_existant', label: 'ajouter le tracé d’un réseau existant' },
  { key: 'trace_construction', label: 'ajouter le tracé d’un réseau en construction (nouveau réseau ou extension)' },
  { key: 'pdp', label: 'ajouter un périmètre de développement prioritaire' },
  { key: 'autre', label: 'autre' },
] as const satisfies readonly { key: (typeof networkChangeRequestKinds)[number]; label: string }[];

export type TypeDemande = (typeof typesDemande)[number]['key'];

export const filesLimits = fileUploadLimits;

/** Geo formats (and PDF) accepted for a trace or a perimeter, from the server-side allowlist. */
export const geoAllowedExtensions = ObjectEntries(allowedFileTypes)
  .filter(([, fileType]) => fileType.group === 'geo' || fileType.group === 'pdf')
  .map(([extension]) => extension as AllowedFileExtension);

const requiredShapefileExtensions = ['.shp', '.prj'];

/**
 * Validate file names against allowed extensions and shapefile completeness (.shp + .prj required).
 * Returns an error message if invalid, or null if valid.
 */
export const validateFileNames = (fileNames: string[], allowedExtensions: string[]): string | null => {
  for (const name of fileNames) {
    const ext = `.${name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(ext)) {
      return `L'extension "${ext}" du fichier "${name}" n'est pas autorisée. Extensions acceptées : ${allowedExtensions.join(', ')}.`;
    }
  }

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
    .refine((files) => files.reduce((totalFileSize, file) => totalFileSize + file.size, 0) <= filesLimits.maxTotalFileSize, {
      error: `Le total des fichier doit être inférieur à ${formatFileSize(filesLimits.maxTotalFileSize)}.`,
    })
    .superRefine((files, ctx) => {
      const directError = validateFileNames(
        files.map((file) => file.name),
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
          allowedExtensions.filter((extension) => extension !== '.zip')
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

// full validation for the submit: sync checks + zip inspection in one schema
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

// same rules as the server input (`zCreateNetworkChangeRequestInput`): a server rejection is never expected on a valid form
const requiredStringSchema = z.string({ error: 'Ce champ est obligatoire' }).trim().min(1, 'Ce champ est obligatoire');
const optionalPositiveNumberSchema = z.number().positive('La puissance doit être supérieure à 0').optional();

const sncuIdentificationFieldsShape = {
  identifiantReseau: z.string().optional(),
};

export const zCommonFormData = z.object({
  dansCadreDemandeADEME: z.boolean({ error: 'Ce choix est obligatoire' }),
  email: z.email("L'adresse email n'est pas valide"),
  nom: z.string({ error: 'Ce champ est obligatoire' }).min(1, 'Ce champ est obligatoire'),
  prenom: z.string({ error: 'Ce champ est obligatoire' }).min(1, 'Ce champ est obligatoire'),
  typeUtilisateur: z.enum(nonEmptyArray(typesUtilisateur.map((typeUtilisateur) => typeUtilisateur.key)), {
    error: 'Ce choix est obligatoire',
  }),
  typeUtilisateurAutre: z.string().optional(),
});

export const isTypeUtilisateurAutreValid = (data: { typeUtilisateur?: string; typeUtilisateurAutre?: string }) =>
  data.typeUtilisateur !== 'autre' || !!data.typeUtilisateurAutre;
export const typeUtilisateurAutreRefineParams = { message: 'Ce champ est obligatoire', path: ['typeUtilisateurAutre'], when: () => true };

export const isEmailReferentCommercialValid = (data: {
  typeDemande?: string;
  ouvertAuxRaccordements?: boolean;
  emailReferentCommercial?: string;
}) => !data.ouvertAuxRaccordements || !!data.emailReferentCommercial;
export const emailReferentCommercialRefineParams = {
  message: 'Le référent commercial est obligatoire si le réseau est ouvert aux raccordements',
  path: ['emailReferentCommercial'],
  when: () => true,
};

const createContributionBranches = (filesSchema: typeof createFilesSchema) => {
  const reseauFieldsShape = {
    commentaire: z.string().optional(),
    emailReferentCommercial: z.union([z.literal(''), z.email()], { error: "L'adresse email n'est pas valide" }).optional(),
    fichiers: filesSchema(geoAllowedExtensions),
    fichiersPDP: filesSchema(geoAllowedExtensions).optional(),
    gestionnaire: requiredStringSchema,
    ...sncuIdentificationFieldsShape,
    localisation: z.string().trim().optional(),
    maitreOuvrage: requiredStringSchema,
    nomReseau: requiredStringSchema,
    ouvertAuxRaccordements: z.boolean({ error: 'Ce choix est obligatoire' }),
    reseauDeclasse: z.boolean().optional(),
  };

  return [
    zCommonFormData.extend({
      typeDemande: z.literal('trace_existant'),
      ...reseauFieldsShape,
    }),
    zCommonFormData.extend({
      typeDemande: z.literal('trace_construction'),
      ...reseauFieldsShape,
      dateMiseEnServicePrevisionnelle: requiredStringSchema,
      puissanceTotalePrevisionnelleMW: optionalPositiveNumberSchema,
    }),
    zCommonFormData.extend({
      fichiers: filesSchema(geoAllowedExtensions),
      ...sncuIdentificationFieldsShape,
      localisation: requiredStringSchema,
      nomReseau: requiredStringSchema,
      typeDemande: z.literal('pdp'),
    }),
    zCommonFormData.extend({
      precisions: requiredStringSchema,
      typeDemande: z.literal('autre'),
    }),
  ] as const;
};

export const zContributionFormDataBase = z.discriminatedUnion(
  'typeDemande',
  createContributionBranches(createFilesSchemaWithZipInspection),
  {
    error: 'Ce choix est obligatoire',
  }
);

export const zContributionFormData = zContributionFormDataBase
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams);

export type ContributionFormData = z.infer<typeof zContributionFormData>;

export type ContributionFormValues = Omit<z.input<typeof zCommonFormData>, 'dansCadreDemandeADEME' | 'typeUtilisateur'> & {
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
};

export const contributionDefaultValues: ContributionFormValues = {
  dansCadreDemandeADEME: undefined,
  email: '',
  identifiantReseau: '',
  nom: '',
  prenom: '',
  reseauDeclasse: false,
  typeDemande: '',
  typeUtilisateur: '',
  typeUtilisateurAutre: '',
};

export const zContributionForm = z
  .discriminatedUnion('typeDemande', [
    ...createContributionBranches(createFilesSchema),
    zCommonFormData.extend({ typeDemande: z.literal('').refine(() => false, { message: 'Ce choix est obligatoire' }) }),
  ])
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams) as unknown as z.ZodType<
  ContributionFormValues,
  ContributionFormValues
>;

export const createFichiersFieldValidator = (allowedExtensions: string[], options: { required?: boolean } = {}) => {
  const schema =
    options.required === false
      ? createFilesSchemaWithZipInspection(allowedExtensions).optional()
      : createFilesSchemaWithZipInspection(allowedExtensions);
  return async ({ value }: { value: File[] | undefined }) => {
    const result = await schema.safeParseAsync(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };
};

export const geoFichiersValidator = createFichiersFieldValidator(geoAllowedExtensions);
export const optionalGeoFichiersValidator = createFichiersFieldValidator(geoAllowedExtensions, { required: false });
