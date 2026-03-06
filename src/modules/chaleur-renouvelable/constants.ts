import { z } from 'zod';

export const DPE_VALUES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export type DPE = (typeof DPE_VALUES)[number];

export const TYPE_LOGEMENT_VALUES = ['immeuble_chauffage_collectif', 'immeuble_chauffage_individuel', 'maison_individuelle'] as const;
export type TypeLogement = (typeof TYPE_LOGEMENT_VALUES)[number];

export const ESPACE_EXTERIEUR_VALUES = ['shared', 'private', 'both', 'none'] as const;
export type EspaceExterieur = (typeof ESPACE_EXTERIEUR_VALUES)[number];
export const espaceExterieurOptions = [
  { description: 'Cour, jardin, toit terrasse…', label: 'Espaces partagés uniquement', value: 'shared' },
  { description: 'Balcons, terrasses…', label: 'Espaces individuels uniquement', value: 'private' },
  { description: 'Cour, jardin, toit terrasse, balcons…', label: 'Espaces partagés et individuels', value: 'both' },
  { label: 'Aucun espace extérieur', value: 'none' },
] as const satisfies readonly {
  label: string;
  description?: string;
  value: EspaceExterieur;
}[];

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

export const zAirtableAdemeHelp = z.object({
  Adresse: z.string(),
  Date: z.iso.datetime(),
  DPE: z.enum(DPE_VALUES),
  Email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
  'Espace extérieur': z.enum(['Partagés uniquement', 'Individuels uniquement', 'Partagés et individuels', 'Aucun']),
  'Mode de chauffage': z.enum(TYPE_LOGEMENT_VALUES),
  'Nb habitant moyen': z.number(),
  'Nombre de logement': z.number(),
  'Surface moyenne': z.number(),
  Telephone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
    .optional()
    .default(''),
  'Url simulation': z.string(),
});
export type GetAirtableAdeme = z.infer<typeof zAirtableAdemeHelp>;

export const zLocationInfos = z.strictObject({
  city: z.string(),
  cityCode: z.string(),
});
export type GetLocationInput = z.infer<typeof zLocationInfos>;

export const zLonLat = z.strictObject({
  lat: z.number(),
  lon: z.number(),
});
export type GetLonLatInput = z.infer<typeof zLonLat>;

export const zRnbByBanIdInput = z.object({
  banId: z.string().min(1, 'banId manquant'),
});
export type RnbByBanIdInput = z.infer<typeof zRnbByBanIdInput>;
