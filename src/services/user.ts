import { z } from 'zod';

import { userRolesInscription } from '@/types/enum/UserRole';

export const zCredentialsSchema = z.object({
  email: z.string().email("L'adresse email n'est pas valide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  role: z.enum(userRolesInscription),
  accept_cgu: z.boolean().refine((val) => val === true, {
    message: "Veuillez accepter les conditions générales d'utilisation",
  }),
  optin_newsletter: z.boolean().optional(),
});

export type CredentialsSchema = z.infer<typeof zCredentialsSchema>;

export const zIdentitySchema = z
  .object({
    first_name: z.string().min(1, 'Le prénom est obligatoire'),
    last_name: z.string().min(1, 'Le nom de famille est obligatoire'),
    structure: z.string().min(1, 'La structure est obligatoire'),
    structure_type: z.string(),
    structure_other: z.string().optional(),
    job: z.string().min(1, 'Le poste est obligatoire'),
    email: z.string().email("L'adresse email n'est pas valide"),
    phone: z.string().nullable().optional(),
  })
  .refine((data) => !(data.structure_type === 'other' && !data.structure_other), {
    message: "Le type de structure 'Autre' doit être précisé",
    path: ['structure_other'],
  });

export type IdentitySchema = z.infer<typeof zIdentitySchema>;

export const zAdditionalInfoSchema = z.object({
  besoins: z.array(z.string()),
});

export type AdditionalInfoSchema = z.infer<typeof zAdditionalInfoSchema>;

export const registrationSchema = zCredentialsSchema.merge(zIdentitySchema.innerType()).merge(zAdditionalInfoSchema);
export type RegistrationSchema = z.infer<typeof registrationSchema>;
