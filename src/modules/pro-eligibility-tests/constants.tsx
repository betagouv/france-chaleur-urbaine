import { z } from 'zod';

import { clientConfig } from '@/client-config';
import { formatFileSize } from '@/utils/strings';

const filesLimits = {
  maxFileSize: 50 * 1024 * 1024,
};

export const allowedExtensions = ['.csv', '.txt'] as const;

export const NO_SEPARATOR_VALUE = '__NO_SEPARATOR__';

export const zAddressesFile = z
  .instanceof(File, { error: 'Veuillez choisir un fichier' })
  .refine((file) => file.size <= filesLimits.maxFileSize, {
    error: `La taille du fichier doit être inférieure à ${formatFileSize(filesLimits.maxFileSize)}.`,
  })
  .refine((file) => allowedExtensions.some((extension) => file.name.endsWith(extension)), {
    error: `Le format du fichier n'est pas supporté (attendu : ${allowedExtensions.join(', ')})`,
  });

export const zColumnMapping = z
  .object({
    addressColumn: z.number().min(0).optional(),
    latitudeColumn: z.number().min(0).optional(),
    longitudeColumn: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      // Must have either address OR both coordinates
      const hasAddress = data.addressColumn !== undefined;
      const hasCoordinates = data.latitudeColumn !== undefined && data.longitudeColumn !== undefined;
      return hasAddress || hasCoordinates;
    },
    {
      error: 'Vous devez sélectionner soit une adresse, soit les coordonnées latitude/longitude',
      path: ['addressColumn'],
    }
  )
  .refine(
    (data) => {
      // If one coordinate is specified, both must be specified
      const hasLat = data.latitudeColumn !== undefined;
      const hasLng = data.longitudeColumn !== undefined;
      return hasLat === hasLng; // Both true or both false
    },
    {
      error: 'Les colonnes latitude et longitude doivent être sélectionnées ensemble',
      path: ['longitudeColumn'],
    }
  )
  .refine(
    (data) => {
      // Cannot have both address and coordinates
      const hasAddress = data.addressColumn !== undefined;
      const hasCoordinates = data.latitudeColumn !== undefined && data.longitudeColumn !== undefined;
      return !(hasAddress && hasCoordinates);
    },
    {
      error: 'Vous devez choisir soit une adresse, soit des coordonnées (pas les deux)',
      path: ['addressColumn'],
    }
  );

export const zCreateEligibilityTestInput = z.strictObject({
  columnMapping: zColumnMapping.optional(),
  content: z.string(),
  dataType: z.enum(['address', 'coordinates']),
  // file: zAddressesFile, // TODO: uncomment this when we have a way to handle files
  hasHeaders: z.boolean(),
  name: z
    .string({ error: 'Le nom du test est obligatoire' })
    .min(1, { error: 'Le nom du test est obligatoire' })
    .max(100, { error: 'Le nom du test ne doit pas dépasser 100 caractères' }),
  separator: z.string().optional().nullable(),
});

export type CreateEligibilityTestInput = z.infer<typeof zCreateEligibilityTestInput>;

export const zUpdateEligibilityTestInput = z.strictObject({
  columnMapping: zColumnMapping.optional(),
  content: z.string().optional(),
  dataType: z.enum(['address', 'coordinates']).optional(),
  hasHeaders: z.boolean().optional(),
  // file: zAddressesFile, // TODO: uncomment this when we have a way to handle files
  id: z.string(),
  separator: z.string().optional().nullable(),
});

export const zRenameEligibilityTestInput = z.strictObject({
  id: z.string(),
  name: z
    .string({ error: 'Le nom du test est obligatoire' })
    .min(1, { error: 'Le nom du test est obligatoire' })
    .max(100, { error: 'Le nom du test ne doit pas dépasser 100 caractères' }),
});

export type UpdateEligibilityTestInput = z.infer<typeof zUpdateEligibilityTestInput>;

export const zRenameProEligibilityTestRequest = z.strictObject({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(200, 'Le nom ne peut pas contenir plus de 200 caractères'),
});
export type RenameProEligibilityTestRequest = z.infer<typeof zRenameProEligibilityTestRequest>;

export const FormErrorMessage = () => (
  <span>
    Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous directement à l'adresse:{' '}
    <a href={`mailto:${clientConfig.contactEmail}`}>{clientConfig.contactEmail}</a>
  </span>
);

/**
 * Labels des types de transition d'éligibilité
 * Partagé entre le client et le serveur pour garantir la cohérence
 */
export const transitionLabels = {
  amelioration_proximite: 'Amélioration de la proximité',
  changement_reseau: 'Changement de réseau',
  changement_type: 'Changement de type',
  degradation_proximite: 'Dégradation de la proximité',
  eloignement: 'Éloignement du réseau',
  entree_pdp: 'Entrée dans un PDP',
  entree_ville_reseau_sans_trace: 'Entrée dans une ville avec réseau sans tracé',
  futur_vers_existant: 'Réseau futur devenu existant',
  initial: 'Calcul initial',
  modification_mineure: 'Modification mineure',
  none: 'Aucun changement',
  nouveau_reseau: 'Nouveau réseau',
  nouveau_reseau_existant: 'Nouveau réseau existant',
  nouveau_reseau_futur: 'Nouveau réseau futur',
  rapprochement: 'Rapprochement du réseau',
  reseau_supprime: 'Réseau supprimé',
  sortie_pdp: "Sortie d'un PDP",
  sortie_ville_reseau_sans_trace: "Sortie d'une ville avec réseau sans tracé",
} as const satisfies Record<string, string>;

export type TransitionType = keyof typeof transitionLabels;
