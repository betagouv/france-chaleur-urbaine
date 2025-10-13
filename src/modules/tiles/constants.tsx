import { z } from 'zod';

export const zBuildTilesInput = z.strictObject({
  name: z.enum(
    ['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire', 'tests-adresses'],
    {
      message: 'Le nom de la table est invalide',
    }
  ),
});

export type BuildTilesInput = z.infer<typeof zBuildTilesInput>;
