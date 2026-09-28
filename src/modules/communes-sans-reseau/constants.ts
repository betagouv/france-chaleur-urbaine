import { z } from 'zod';

const inseeCodeRegex = /^(\d{2}|2[AB])\d{3}$/;

/** Demande d'accompagnement envoyée depuis la page « potentiel de création de réseau ». Les potentiels sont recalculés côté serveur. */
export const zCreateDemandeCommuneSansReseauInput = z.object({
  codeInsee: z.string().regex(inseeCodeRegex, 'Code INSEE invalide'),
  email: z
    .email("L'adresse email n'est pas valide")
    .max(100, "L'email ne peut pas dépasser 100 caractères")
    .transform((email) => email.trim().toLowerCase()),
});
export type CreateDemandeCommuneSansReseauInput = z.infer<typeof zCreateDemandeCommuneSansReseauInput>;
