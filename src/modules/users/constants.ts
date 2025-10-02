import { z } from 'zod';

import { userRoles, userRolesInscription } from '@/types/enum/UserRole';

export const structureTypes = {
  autre: 'Autre (préciser)',
  bailleur_social: 'Bailleur social',
  bureau_etudes: "Bureau d'études",
  collectivite: 'Collectivité',
  gestionnaire_parc_tertiaire: 'Gestionnaire de parc tertiaire',
  gestionnaire_reseaux: 'Gestionnaire de réseaux de chaleur',
  mandataire_cee: 'Mandataire / délégataire CEE',
  syndic_copropriete: 'Syndic de copropriété',
};

export const zCredentialsSchema = z.object({
  accept_cgu: z.boolean().refine((val) => val === true, {
    error: "Veuillez accepter les conditions générales d'utilisation",
  }),
  email: z.string().email("L'adresse email n'est pas valide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  optin_newsletter: z.boolean(),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

export type CredentialsSchema = z.infer<typeof zCredentialsSchema>;

export const zIdentitySchema = z
  .object({
    email: z.string().email("L'adresse email n'est pas valide"),
    first_name: z.string().min(1, 'Le prénom est obligatoire'),
    last_name: z.string().min(1, 'Le nom de famille est obligatoire'),
    phone: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val), {
        error: "Le numéro de téléphone n'est pas valide",
      }),
    role: z.enum(userRolesInscription),
    structure_name: z.string().min(0, 'La structure est obligatoire').optional(),
    structure_other: z.string().optional(),
    structure_type: z.string().optional(),
  })
  .refine((data) => !(data.structure_type === 'autre' && !data.structure_other), {
    error: "Le type de structure 'Autre' doit être précisé",
    path: ['structure_other'],
  })
  .refine((data) => data.role === 'particulier' || !!data.structure_name, {
    error: 'La structure est obligatoire',
    path: ['structure_name'],
  })
  .refine((data) => data.role === 'particulier' || !!data.structure_type, {
    error: 'Le type de structure est obligatoire',
    path: ['structure_type'],
  });

export type IdentitySchema = z.infer<typeof zIdentitySchema>;

// Can't use .merge() because of use of refine
export const registrationSchema = z.intersection(zCredentialsSchema, zIdentitySchema);

export type RegistrationSchema = z.infer<typeof registrationSchema>;

export const createUserAdminSchema = z.object({
  email: z.email(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  optin_at: z.boolean().nullable(),
  phone: z.string().optional().nullable(),
  receive_new_demands: z.boolean(),
  receive_old_demands: z.boolean(),
  role: z.enum(userRoles),
  structure_name: z.string().optional().nullable(),
  structure_other: z.string().optional().nullable(),
  structure_type: z.string().optional().nullable(),
});

export const updateUserAdminSchema = z
  .object({
    active: z.boolean(),
    email: z.email().optional(),
    first_name: z.string().optional(),
    gestionnaires: z.array(z.string()).optional(),
    last_name: z.string().optional(),
    optin_at: z.boolean().optional(),
    phone: z.string().optional(),
    receive_new_demands: z.boolean().optional(),
    receive_old_demands: z.boolean().optional(),
    role: z.enum(userRoles).optional(),
    status: z.enum(['pending_email_confirmation', 'valid']),
    structure_name: z.string().optional(),
    structure_other: z.string().optional(),
    structure_type: z.string().optional(),
  })
  .partial();
