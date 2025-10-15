import { z } from 'zod';

// Types de jobs disponibles
export const jobTypes = [
  'build_tiles',
  'pro_eligibility_test',
  'pro_eligibility_test_notify_changes',
  'sync_geometries_to_airtable',
  'sync_metadata_from_airtable',
] as const;

export const jobStatuses = ['pending', 'processing', 'finished', 'error'] as const;

// Schémas de validation Zod
export const zJobType = z.enum(jobTypes);
export const zJobStatus = z.enum(jobStatuses);

export const zJobListInput = z.object({
  limit: z.number().min(1).max(100).default(50).meta({ description: 'Nombre maximum de résultats' }),
  offset: z.number().min(0).default(0).meta({ description: 'Décalage pour la pagination' }),
  orderBy: z.enum(['created_at', 'updated_at', 'type', 'status']).default('created_at').meta({ description: 'Tri par champ' }),
  orderDirection: z.enum(['asc', 'desc']).default('desc').meta({ description: 'Direction du tri' }),
  statuses: z.array(zJobStatus).optional().meta({ description: 'Filtrer par statuts' }),
  types: z.array(zJobType).optional().meta({ description: 'Filtrer par types de jobs' }),
  userId: z.uuid().optional().meta({ description: 'Filtrer par utilisateur' }),
});

export type JobType = z.infer<typeof zJobType>;
export type JobStatus = z.infer<typeof zJobStatus>;
export type JobListInput = z.infer<typeof zJobListInput>;
