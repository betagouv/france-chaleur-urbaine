import { z } from 'zod';

export type DPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export const DPE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const satisfies readonly DPE[];

export type TypeLogement = 'immeuble_chauffage_collectif' | 'immeuble_chauffage_individuel' | 'maison_individuelle';
export const typeLogementValues = [
  'immeuble_chauffage_collectif',
  'immeuble_chauffage_individuel',
  'maison_individuelle',
] as const satisfies readonly TypeLogement[];

export type EspaceExterieur = 'shared' | 'private' | 'both' | 'none';
export const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];

export const fieldLabelInformation = {
  email: 'Email',
  phone: 'Téléphone',
};
export const zContactFormAdemeHelp = z.object({
  email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  phone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
  termOfUse: z.boolean().refine((val) => val, {
    error: 'Ce champ est requis',
  }),
});

export const zAirtableAdemeHelp = {
  Adresse: z.string(),
  Date: z.iso.datetime(),
  DPE: z.enum(DPE_ORDER),
  Email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  'Espace extérieur': z.enum(['Partagés uniquement', 'Individuels uniquement', 'Partagés et individuels', 'Aucun'] as const),
  'Mode de chauffage': z.enum(typeLogementValues),
  'Nb habitant moyen': z.number(),
  'Nombre de logement': z.number(),
  'Surface moyenne': z.number(),
  Telephone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
};

export const zLocationInfos = z.strictObject({
  city: z.string(),
  cityCode: z.string(),
});
export type GetLocationInput = z.infer<typeof zLocationInfos>;
