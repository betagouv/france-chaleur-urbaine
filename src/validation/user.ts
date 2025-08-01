import { z } from 'zod';

import { userRoles, userRolesInscription } from '@/types/enum/UserRole';

export const structureTypes = {
  bureau_etudes: "Bureau d'études",
  gestionnaire_reseaux: 'Gestionnaire de réseaux de chaleur',
  collectivite: 'Collectivité',
  syndic_copropriete: 'Syndic de copropriété',
  bailleur_social: 'Bailleur social',
  gestionnaire_parc_tertiaire: 'Gestionnaire de parc tertiaire',
  mandataire_cee: 'Mandataire / délégataire CEE',
  autre: 'Autre (préciser)',
};

export const zCredentialsSchema = z.object({
  email: z.string().email("L'adresse email n'est pas valide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  accept_cgu: z.boolean().refine((val) => val === true, {
    message: "Veuillez accepter les conditions générales d'utilisation",
  }),
  optin_newsletter: z.boolean(),
});

export type CredentialsSchema = z.infer<typeof zCredentialsSchema>;

export const zIdentitySchema = z
  .object({
    first_name: z.string().min(1, 'Le prénom est obligatoire'),
    last_name: z.string().min(1, 'Le nom de famille est obligatoire'),
    role: z.enum(userRolesInscription),
    structure_name: z.string().min(0, 'La structure est obligatoire').optional(),
    structure_type: z.string().optional(),
    structure_other: z.string().optional(),
    email: z.string().email("L'adresse email n'est pas valide"),
    phone: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val), {
        message: "Le numéro de téléphone n'est pas valide",
      }),
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
  email: z.string().email(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  structure_name: z.string().optional().nullable(),
  structure_other: z.string().optional().nullable(),
  structure_type: z.string().optional().nullable(),
  optin_at: z.boolean().nullable(),
  phone: z.string().optional().nullable(),
  receive_new_demands: z.boolean(),
  receive_old_demands: z.boolean(),
  role: z.enum(userRoles),
});

export const updateUserAdminSchema = z
  .object({
    status: z.enum(['pending_email_confirmation', 'valid']),
    active: z.boolean(),
    email: z.string().email().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    gestionnaires: z.array(z.string()).optional(),
    structure_name: z.string().optional(),
    structure_other: z.string().optional(),
    structure_type: z.string().optional(),
    optin_at: z.boolean().optional(),
    phone: z.string().optional(),
    receive_new_demands: z.boolean().optional(),
    receive_old_demands: z.boolean().optional(),
    role: z.enum(userRoles).optional(),
  })
  .partial();
