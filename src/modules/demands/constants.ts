import { z } from 'zod';

export const zAddRelanceCommentInput = z.object({
  comment: z.string().min(1, 'Le commentaire est requis'),
  relanceId: z.string(),
});

// Zod schema for demand update values - only fields actually used in updateDemand calls
// Analysis based on all updateDemand usage across the codebase
const zDemandUpdateValues = z
  // biome-ignore assist/source/useSortedKeys: keep field order for clarity and maintainability
  .object({
    // Tags & Assignment
    'Gestionnaire Affecté à': z.string(),

    // Network info
    'Gestionnaire Distance au réseau': z.number(),

    // Status & Contact
    Status: z.string(), // DemandStatus | ''
    'Prise de contact': z.boolean(),

    // Communication
    Commentaire: z.string(),

    // Additional info
    'Gestionnaire Conso': z.number(),
    'Gestionnaire Logement': z.number(),
    'Surface en m2': z.number(),
  })
  .partial();

export const zAdminDemandUpdateValues = z
  // biome-ignore assist/source/useSortedKeys: keep field order for clarity and maintainability
  .object({
    // Tags & Assignment
    Gestionnaires: z.union([z.string(), z.array(z.string()), z.null()]),
    'Affecté à': z.union([z.string(), z.array(z.string()), z.null()]),
    'Gestionnaires validés': z.boolean(),

    // Network info
    'Distance au réseau': z.number().nullable(),
    'Identifiant réseau': z.string().nullable(),
    'Nom réseau': z.string().nullable(),

    // Status & Contact
    'Relance à activer': z.boolean(),

    // Communication
    Commentaires_internes_FCU: z.string(),
  })
  .partial();

export const zUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zDemandUpdateValues,
});

export const zAdminUpdateDemandInput = z.object({
  demandId: z.string(),
  values: zAdminDemandUpdateValues,
});

export const demandStatuses = [
  { label: 'En attente de prise en charge', value: 'empty' },
  { label: 'Non réalisable', value: 'unrealisable' },
  { label: 'En attente d’éléments du prospect', value: 'waiting' },
  { label: 'Étude en cours', value: 'in_progress' },
  { label: 'Voté en AG', value: 'voted' },
  { label: 'Travaux en cours', value: 'work_in_progress' },
  { label: 'Réalisé', value: 'done' },
  { label: 'Projet abandonné par le prospect', value: 'abandoned' },
] as const;

export const demandStatusDefault = demandStatuses[0].label;

export type DemandStatus = (typeof demandStatuses)[number]['label'];
