import { z } from 'zod';

export const zCreateOrganization = z.object({
  name: z.string().trim().min(1, 'Le nom est requis').max(255),
});

export const zUpdateOrganization = zCreateOrganization;

export const zCreateCredential = z.object({
  name: z.string().trim().min(1).max(255).nullish(),
  organizationId: z.uuidv4(),
});

export type CreateOrganizationInput = z.infer<typeof zCreateOrganization>;
export type UpdateOrganizationInput = z.infer<typeof zUpdateOrganization>;
