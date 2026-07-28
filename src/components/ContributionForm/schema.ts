import { z } from 'zod';

import { formatFileSize } from '@/utils/strings';
import { nonEmptyArray } from '@/utils/typescript';

export const typesUtilisateur = [
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

export type TypeUtilisateur = (typeof typesUtilisateur)[number]['key'];

export const typesDemande = [
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

export type TypeDemande = (typeof typesDemande)[number]['key'];

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
const positiveNumberSchema = z.number({ error: 'Ce champ est obligatoire' }).positive('La puissance doit être supérieure à 0');

const sncuIdentificationFieldsShape = {
  identifiantReseau: z.string().optional(),
  reseauSansIdentifiantSNCU: z.boolean().optional(),
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
  data.typeUtilisateur !== 'Autre' || !!data.typeUtilisateurAutre;
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

const createContributionBranches = (filesSchema: typeof createFilesSchema) => {
  const reseauFieldsShape = {
    commentaire: z.string().optional(),
    emailReferentCommercial: z.string().optional(),
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
      puissanceTotalePrevisionnelleMW: positiveNumberSchema,
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
  { error: 'Ce choix est obligatoire' }
);

export const zContributionFormData = zContributionFormDataBase
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams)
  .refine(isSncuIdentificationValid, sncuIdentificationRefineParams);

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
  reseauSansIdentifiantSNCU?: boolean;
};

export const contributionDefaultValues: ContributionFormValues = {
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

export const zContributionForm = z
  .discriminatedUnion('typeDemande', [
    ...createContributionBranches(createFilesSchema),
    zCommonFormData.extend({ typeDemande: z.literal('').refine(() => false, { message: 'Ce choix est obligatoire' }) }),
  ])
  .refine(isEmailReferentCommercialValid, emailReferentCommercialRefineParams)
  .refine(isTypeUtilisateurAutreValid, typeUtilisateurAutreRefineParams)
  .refine(isSncuIdentificationValid, sncuIdentificationRefineParams) as unknown as z.ZodType<
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
export const docFichiersValidator = createFichiersFieldValidator(docAllowedExtensions);
