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

export const zSyncGeometriesInput = z.strictObject({
  name: z.enum(['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'], {
    message: 'Le nom de la table est invalide',
  }),
});

export const zGetBdnbBatimentInput = z.strictObject({
  batiment_groupe_id: z.string().min(1, "L'ID du groupe de bâtiment est requis"),
});
export type GetBdnbBatimentInput = z.infer<typeof zGetBdnbBatimentInput>;
