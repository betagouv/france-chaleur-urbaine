import { z } from 'zod';

import { availableStructures, demandStatusDefault, modesDeChauffageLabels, typesDeChauffageLabels } from '@/modules/demands/constants';
import { networkTypes } from '@/modules/reseaux/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

/**
 * SOURCE UNIQUE du contrat de l'API partenaire (`/api/v2/demands`).
 *
 * Tout dérive d'ici :
 *  - le DTO renvoyé (`DemandDTO = z.infer<typeof zDemande>`, vérifié à la compilation par le mapper) ;
 *  - la spec OpenAPI (`z.toJSONSchema`, cf. `server/openapi.ts`, régénérée par `pnpm cli openapi:generate`) ;
 *  - le tableau de documentation de la page `/api-gestionnaires`.
 *
 * Module volontairement **sans dépendance serveur** (importé côté page) : pas de DB, pas de helpers Node.
 */

// ─── Statut : libellé métier stocké tel quel dans `legacy_values.Status` (= valeur en BDD), exposé sans conversion ────
// Pas de mapping vers des clés : la valeur de l'API EST le libellé de l'enum DEMANDE_STATUS.
export const demandeStatuts = Object.values(DEMANDE_STATUS);

export type DemandStatut = DEMANDE_STATUS;

const demandeStatutSet = new Set<string>(demandeStatuts);

/** Normalise le libellé stocké en statut API (le libellé lui-même) ; absent/inconnu ⇒ défaut. */
export const toDemandeStatut = (label: string | null | undefined): DemandStatut =>
  demandeStatutSet.has(label as string) ? (label as DemandStatut) : demandStatusDefault;

export const zDemandeStatut = z.enum(demandeStatuts).describe(`Statut d'avancement : ${demandeStatuts.join(', ')}.`);

// ─── DTO (contrat de réponse) ────────────────────────────────────────────────────

const zReseau = z
  .object({
    gestionnaire: z.string().nullable().describe('Gestionnaire du réseau affecté.'),
    id_fcu: z.number().int().describe('Identifiant interne FCU du réseau affecté.'),
    identifiant_sncu: z.string().nullable().describe('Identifiant national SNCU (null pour un réseau en construction).'),
    maitre_ouvrage: z.string().nullable().describe("Maître d'ouvrage du réseau (réseaux de chaleur uniquement, sinon null)."),
    nom: z.string().nullable().describe('Nom du réseau affecté.'),
    type: z.enum(networkTypes).describe('reseau_de_chaleur ou reseau_en_construction.'),
  })
  .describe('Réseau affecté à la demande.');

const zContact = z
  .object({
    email: z.string().nullable().describe('E-mail du prospect.'),
    nom: z.string().nullable().describe('Nom du prospect.'),
    prenom: z.string().nullable().describe('Prénom du prospect.'),
    telephone: z.string().nullable().describe('Téléphone du prospect.'),
  })
  .describe('Coordonnées du prospect — données personnelles (RGPD).');

const zLocalisation = z
  .object({
    adresse: z.string().nullable().describe('Adresse du bien.'),
    code_postal: z.string().nullable().describe('Code postal.'),
    commune_code: z.string().nullable().describe('Code INSEE de la commune.'),
    commune_label: z.string().nullable().describe('Nom de la commune.'),
    departement_code: z.string().nullable().describe('Code INSEE du département.'),
    departement_label: z.string().nullable().describe('Nom du département.'),
    latitude: z.number().nullable().describe('Latitude (WGS84).'),
    longitude: z.number().nullable().describe('Longitude (WGS84).'),
    region_code: z.string().nullable().describe('Code INSEE de la région.'),
    region_label: z.string().nullable().describe('Nom de la région.'),
  })
  .describe('Localisation du bien — donnée personnelle (RGPD).');

const zBatiment = z
  .object({
    energie_chauffage: z
      .enum(modesDeChauffageLabels)
      .nullable()
      .describe(`Énergie de chauffage actuelle : ${modesDeChauffageLabels.join(', ')}.`),
    etablissement: z.string().nullable().describe("Nom de l'établissement ou de la structure."),
    nombre_logements: z.number().int().nullable().describe('Nombre de logements (valeur corrigée par le gestionnaire si renseignée).'),
    surface_m2: z.number().nullable().describe('Surface chauffée (m²).'),
    type_chauffage: z
      .enum(typesDeChauffageLabels)
      .nullable()
      .describe(`Type de chauffage : ${typesDeChauffageLabels.join(', ')}.`),
    type_structure: z
      .enum(availableStructures)
      .nullable()
      .describe(`Type de structure : ${availableStructures.join(', ')}.`),
  })
  .describe('Caractéristiques du bâtiment.');

const zEligibilite = z
  .object({
    dans_pdp: z.boolean().describe('Située dans un Périmètre de Développement Prioritaire.'),
    distance_reseau_m: z.number().nullable().describe('Distance estimée au réseau (m).'),
  })
  .describe('Éligibilité au moment de la demande.');

export const zDemande = z
  .object({
    batiment: zBatiment,
    commentaire: z.string().nullable().describe('Commentaire de suivi du gestionnaire. Modifiable.'),
    contact: zContact,
    date_creation: z.string().describe("Date d'enregistrement de la demande (ISO 8601)."),
    date_modification: z.string().describe('Date de dernière modification (ISO 8601). Sert de curseur de polling.'),
    eligibilite: zEligibilite,
    id: z.string().describe('Identifiant unique et stable de la demande côté FCU.'),
    localisation: zLocalisation,
    reseau: zReseau,
    statut: zDemandeStatut,
  })
  .describe('Demande de raccordement (contrat partenaire stable, versionné, indépendant du stockage interne).');

export type DemandDTO = z.infer<typeof zDemande>;

// ─── Entrées (requête de polling & mutation) ─────────────────────────────────────

export const zListDemandsQuery = z.object({
  updated_since: z.coerce
    .date()
    .optional()
    .describe("Borne basse inclusive sur date_modification (ISO 8601). Omis : renvoie tout l'historique."),
});

/** Corps du PATCH (sans le refine) — sert aussi de source à la spec OpenAPI. */
export const zPatchDemandBody = z.object({
  commentaire: z.string().nullable().optional().describe('Commentaire de suivi du gestionnaire.'),
  statut: zDemandeStatut.optional(),
});

export const zPatchDemandInput = zPatchDemandBody.refine((v) => v.statut !== undefined || v.commentaire !== undefined, {
  message: 'Au moins un champ modifiable (statut ou commentaire) est requis',
});

export type PatchDemandInput = z.infer<typeof zPatchDemandInput>;
