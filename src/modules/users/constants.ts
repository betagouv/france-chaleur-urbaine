import { z } from 'zod';

import { type UserRole, userRoles, userRolesInscription } from '@/types/enum/UserRole';
import { ObjectKeys } from '@/utils/typescript';

/** Label des types de structure  */
// biome-ignore assist/source/useSortedKeys: keep field order for clarity and maintainability
export const structureTypesLabels = {
  bailleur_social: 'Bailleur social',
  bureau_etudes: "Bureau d'études",
  collectivite: 'Collectivité',
  gestionnaire_parc_tertiaire: 'Gestionnaire de parc tertiaire',
  gestionnaire_reseaux: 'Gestionnaire de réseaux de chaleur',
  mandataire_cee: 'Mandataire / délégataire CEE',
  syndic_copropriete: 'Syndic de copropriété',
  alec: 'ALEC',
  ccrt: 'CCRT',
  autre: 'Autre',
};

export type StructureType = keyof typeof structureTypesLabels;

/** Labels utilisés sur le formulaire */
export const structureTypesFormLabels = {
  ...structureTypesLabels,
  autre: 'Autre (préciser)',
};

/**
 * Données entreprise stockées dans `users.entreprise` (JSONB).
 * Clés alignées sur l'API publique recherche-entreprises.
 */
export const zEntreprise = z.object({
  adresse: z.string(),
  nom_complet: z.string(),
  siret: z.string().length(14),
});
export type Entreprise = z.infer<typeof zEntreprise>;

export const roles: Record<UserRole, string> = {
  admin: 'Admin',
  alec: 'ALEC',
  ccrt: 'CCRT',
  collectivite: 'Collectivité',
  gestionnaire: 'Gestionnaire',
  particulier: 'Particulier',
  professionnel: 'Professionnel',
};

export const zCredentialsSchema = z.object({
  accept_cgu: z.boolean().refine((val) => val === true, {
    message: "Veuillez accepter les conditions générales d'utilisation",
  }),
  email: z.email("L'adresse email n'est pas valide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  optin_newsletter: z.boolean(),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

export type CredentialsSchema = z.infer<typeof zCredentialsSchema>;

export const zIdentitySchema = z
  .object({
    email: z.email("L'adresse email n'est pas valide"),
    entreprise: zEntreprise.nullable().optional(),
    first_name: z.string().min(1, 'Le prénom est obligatoire'),
    last_name: z.string().min(1, 'Le nom de famille est obligatoire'),
    phone: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val), {
        message: "Le numéro de téléphone n'est pas valide",
      }),
    role: z.enum(userRolesInscription),
    structure_name: z.string().min(0, 'La structure est obligatoire').optional(),
    structure_other: z.string().optional(),
    structure_type: z.enum(ObjectKeys(structureTypesLabels)).optional(),
  })
  .refine((data) => !(data.structure_type === 'autre' && !data.structure_other), {
    message: "Le type de structure 'Autre' doit être précisé",
    path: ['structure_other'],
  })
  .refine((data) => data.role === 'particulier' || !!data.structure_name, {
    message: 'La structure est obligatoire',
    path: ['structure_name'],
  })
  .refine((data) => data.role === 'particulier' || !!data.structure_type, {
    message: 'Le type de structure est obligatoire',
    path: ['structure_type'],
  });

export type IdentitySchema = z.infer<typeof zIdentitySchema>;

// Can't use .merge() because of use of refine
export const registrationSchema = z.intersection(zCredentialsSchema, zIdentitySchema);

export type RegistrationSchema = z.infer<typeof registrationSchema>;

export const createUserAdminSchema = z.object({
  active: z.boolean().optional(),
  email: z.email().trim().toLowerCase(),
  entreprise: zEntreprise.nullable().optional(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  optin_at: z.boolean().nullable(),
  phone: z.string().optional().nullable(),
  receive_new_demands: z.boolean(),
  receive_old_demands: z.boolean(),
  role: z.enum(userRoles),
  structure_name: z.string().optional().nullable(),
  structure_other: z.string().optional().nullable(),
  structure_type: z.enum(ObjectKeys(structureTypesLabels)).optional().nullable(),
});

export const updateUserAdminSchema = z
  .object({
    active: z.boolean(),
    email: z.email().trim().toLowerCase().optional(),
    entreprise: zEntreprise.nullable().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    optin_at: z.boolean().optional(),
    phone: z.string().optional(),
    receive_new_demands: z.boolean().optional(),
    receive_old_demands: z.boolean().optional(),
    role: z.enum(userRoles).optional(),
    status: z.enum(['pending_email_confirmation', 'valid']),
    structure_name: z.string().optional(),
    structure_other: z.string().optional(),
    structure_type: z.enum(ObjectKeys(structureTypesLabels)).nullable(),
  })
  .partial();

export const zUpdateProfileSchema = z
  .object({
    entreprise: zEntreprise.nullable().optional(),
    first_name: z.string().min(1, 'Le prénom est obligatoire'),
    last_name: z.string().min(1, 'Le nom de famille est obligatoire'),
    phone: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val), {
        message: "Le numéro de téléphone n'est pas valide",
      }),
    structure_name: z.string().optional(),
    structure_other: z.string().optional(),
    structure_type: z.enum(ObjectKeys(structureTypesLabels)).optional(),
  })
  .refine((data) => !(data.structure_type === 'autre' && !data.structure_other), {
    message: "Le type de structure 'Autre' doit être précisé",
    path: ['structure_other'],
  })
  .transform((data) => ({
    ...data,
    structure_other: data.structure_type === 'autre' ? data.structure_other : '',
  }));

export type UpdateProfileSchema = z.infer<typeof zUpdateProfileSchema>;

export const zUpdateNewsletterSchema = z.object({
  optin_newsletter: z.boolean(),
});

export type UpdateNewsletterSchema = z.infer<typeof zUpdateNewsletterSchema>;

export const updateProfileDefaultValues: UpdateProfileSchema = {
  entreprise: null,
  first_name: '',
  last_name: '',
  phone: '',
  structure_name: '',
  structure_other: '',
  structure_type: undefined,
};

// ─── User tags ──────────────────────────────────────────────────────────────

/** Tag background color, stored as a hex string `#rrggbb`. */
export type UserTagColor = string;

/** Neutral grey applied to a tag created on the fly (before any color is picked). */
export const DEFAULT_TAG_COLOR = '#e5e5e5';

const zHexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide');
const zUserTagName = z.string().trim().min(1, "Le nom de l'étiquette est obligatoire").max(50, 'Le nom ne peut pas dépasser 50 caractères');

export const zCreateUserTag = z.object({
  color: zHexColor,
  name: zUserTagName,
});
export type CreateUserTag = z.infer<typeof zCreateUserTag>;

export const zUpdateUserTag = z.object({
  color: zHexColor,
  id: z.uuidv4(),
  name: zUserTagName,
});
export type UpdateUserTag = z.infer<typeof zUpdateUserTag>;

export const MAX_TAGS_PER_USER = 50;

export const zSetUserTags = z.object({
  tagIds: z.array(z.uuidv4()).max(MAX_TAGS_PER_USER, `Maximum ${MAX_TAGS_PER_USER} étiquettes par utilisateur`),
  userId: z.uuidv4(),
});
export type SetUserTags = z.infer<typeof zSetUserTags>;
