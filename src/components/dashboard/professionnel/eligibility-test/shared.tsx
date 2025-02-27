import { z } from 'zod';

import { formatFileSize } from '@/utils/strings';

const filesLimits = {
  maxFileSize: 50 * 1024 * 1024,
};

export const allowedExtensions = ['.csv', '.txt'] as const;

export const zAddressesFile = z
  .instanceof(File, { message: 'Veuillez choisir un fichier' })
  .refine((file) => file.size <= filesLimits.maxFileSize, {
    message: `La taille du fichier doit être inférieure à ${formatFileSize(filesLimits.maxFileSize)}.`,
  })
  .refine((file) => allowedExtensions.some((extension) => file.name.endsWith(extension)), {
    message: `Le format du fichier n'est pas supporté (attendu : ${allowedExtensions.join(', ')})`,
  });

export const FormErrorMessage = () => (
  <span>
    Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous directement à l'adresse:{' '}
    <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">france-chaleur-urbaine@developpement-durable.gouv.fr</a>
  </span>
);
