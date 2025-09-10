import { z } from 'zod';

export const zBuildTilesInput = z.strictObject({
  name: z.enum(['reseaux-de-chaleur', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'], {
    message: 'Le nom de la table est invalide',
  }),
});

export type BuildTilesInput = z.infer<typeof zBuildTilesInput>;
