import { z } from 'zod';

export const zUpdateReseauInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export type UpdateReseauInput = z.infer<typeof zUpdateReseauInput>;

export const zUpdateReseauEnConstructionInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export type UpdateReseauEnConstructionInput = z.infer<typeof zUpdateReseauEnConstructionInput>;
