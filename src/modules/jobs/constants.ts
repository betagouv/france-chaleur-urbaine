import { z } from 'zod';

// Types de jobs disponibles
export const jobTypes = ['build_tiles', 'pro_eligibility_test', 'sync_geometries_to_airtable', 'sync_metadata_from_airtable'] as const;

export const jobStatuses = ['pending', 'processing', 'finished', 'error'] as const;

// Schémas de validation Zod
export const zJobType = z.enum(jobTypes);
export const zJobStatus = z.enum(jobStatuses);

export const zJobListInput = z.object({
  types: z.array(zJobType).optional().describe('Filtrer par types de jobs'),
  statuses: z.array(zJobStatus).optional().describe('Filtrer par statuts'),
  userId: z.string().uuid().optional().describe('Filtrer par utilisateur'),
  limit: z.number().min(1).max(100).default(50).describe('Nombre maximum de résultats'),
  offset: z.number().min(0).default(0).describe('Décalage pour la pagination'),
  orderBy: z.enum(['created_at', 'updated_at', 'type', 'status']).default('created_at').describe('Tri par champ'),
  orderDirection: z.enum(['asc', 'desc']).default('desc').describe('Direction du tri'),
});

export type JobType = z.infer<typeof zJobType>;
export type JobStatus = z.infer<typeof zJobStatus>;
export type JobListInput = z.infer<typeof zJobListInput>;
