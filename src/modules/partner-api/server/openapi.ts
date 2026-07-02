import type { OpenAPIObject, PathsObject, SchemaObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

import { zDemande, zPatchDemandBody } from '../schema';
import { toYaml } from './yaml';

/**
 * Construit la spec OpenAPI `public/openapi-schema.yaml`. Les schémas de l'API partenaire (v2) sont dérivés
 * de la SOURCE UNIQUE `../schema` via `z.toJSONSchema` ; les endpoints opendata (v1) sont des littéraux stables.
 * Ne jamais éditer le YAML à la main : lancer `pnpm cli openapi:generate` (vérifié par `openapi.spec.ts`).
 */

const MAX_SAFE = 9007199254740991;

/** Nettoie le JSON Schema produit par zod : retire `$schema` et le bruit des bornes d'entiers sûrs. */
const sanitizeSchema = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (value === undefined || key === '$schema') continue;
      if (key === 'minimum' && value === -MAX_SAFE) continue;
      if (key === 'maximum' && value === MAX_SAFE) continue;
      out[key] = sanitizeSchema(value);
    }
    return out;
  }
  return node;
};

const jsonSchema = (schema: z.ZodType): SchemaObject => sanitizeSchema(z.toJSONSchema(schema, { target: 'draft-2020-12' })) as SchemaObject;

// ─── Endpoints opendata v1 (stables, non dérivés) ────────────────────────────────

const v1Paths: PathsObject = {
  '/v1/eligibility': {
    get: {
      parameters: [
        { description: 'Latitude (EPSG:4326)', in: 'query', name: 'lat', required: true, schema: { type: 'number' } },
        { description: 'Longitude (EPSG:4326)', in: 'query', name: 'lon', required: true, schema: { type: 'number' } },
      ],
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: {
                properties: {
                  distance: {
                    description: "distance à vol d'oiseau entre l'adresse testée et le réseau de chaleur le plus proche",
                    type: 'number',
                  },
                  futurNetwork: {
                    description:
                      'true si le réseau le plus proche, sur lequel est établi le résultat isEligible, est un réseau actuellement en construction',
                    type: 'boolean',
                  },
                  gestionnaire: { description: 'nom du gestionnaire du réseau le plus proche', type: 'string' },
                  id: { description: 'identifiant national du réseau de chaleur le plus proche', type: 'string' },
                  inPDP: {
                    description:
                      "true si l'adresse testée se situe dans le périmètre de développement prioritaire d'un réseau classé (zone où s'applique une obligation de raccordement pour certains bâtiments)",
                    type: 'boolean',
                  },
                  isEligible: {
                    description:
                      "true si la distance entre l'adresse testée et le réseau de chaleur le plus proche est inférieure à un certain seuil de distance* ou si nous avons connaissance d'un réseau de chaleur dans le quartier dont nous n'avons pas le tracé. * Le seuil de distance est fixé à 100 m sur Paris, 200 m ailleurs. En pratique ce seuil dépendra des besoins en chaleur du bâtiment à raccorder. Les valeurs prises ici sont volontairement élevées : le gestionnaire du réseau sera le seul à même d'évaluer la faisabilité du raccordement",
                    type: 'boolean',
                  },
                  name: { example: 'Paris et communes limitrophes', type: 'string' },
                  rateCO2: {
                    description:
                      'contenu CO2 en analyse du cycle de vie (émissions directes et indirectes) du réseau de chaleur le plus proche, en kg/kWh, sur la base du dernier arrêté "DPE"',
                    type: 'number',
                  },
                  rateENRR: {
                    description:
                      'taux d\'énergies renouvelables et de récupération du réseau de chaleur le plus proche, en %, sur la base du dernier arrêté "DPE"',
                    type: 'number',
                  },
                },
                type: 'object',
              },
            },
          },
          description: 'Opération réussie',
        },
        '400': { description: 'Erreur de paramètres' },
        '500': { description: 'Erreur technique' },
      },
      summary: "Tester l'éligibilité d'un point géographique avec les réseaux de chaleur.",
      tags: ['Informations générales'],
    },
  },
  '/v1/networks': {
    get: {
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: {
                items: {
                  properties: {
                    'contenu CO2': { example: 0.154, type: 'number' },
                    'contenu CO2 ACV': { example: 0.188, type: 'number' },
                    Gestionnaire: { example: 'CPCU (ENGIE SOLUTIONS)', type: 'string' },
                    geom: {
                      description: 'Géométrie au format GeoJSON',
                      properties: {
                        coordinates: {
                          items: { items: { items: { type: 'number' }, type: 'array' }, type: 'array' },
                          type: 'array',
                        },
                        type: { example: 'MultiLineString', title: 'Type de géométrie', type: 'string' },
                      },
                      type: 'object',
                    },
                    'Identifiant reseau': { description: 'identifiant SNCU', example: '7501C', type: 'string' },
                    id_fcu: { description: 'identifiant interne à France Chaleur Urbaine', type: 'number' },
                    nom_reseau: { example: 'Paris et communes limitrophes', type: 'string' },
                    'Taux EnR&R': { example: 50.1, type: 'number' },
                  },
                  type: 'object',
                },
                type: 'array',
              },
            },
          },
          description: 'Opération réussie',
        },
        '400': { description: 'Erreur de paramètres' },
        '500': { description: 'Erreur technique' },
      },
      summary: 'Lister les réseaux de chaleur et les réseaux de froid',
      tags: ['Informations générales'],
    },
  },
};

// ─── Endpoints partenaire v2 (dérivés de zod) ────────────────────────────────────

const v2Paths: PathsObject = {
  '/v2/demands': {
    get: {
      description:
        'Renvoie toutes les demandes des réseaux rattachés à votre organisation, triées par date_modification croissante. Pour une synchro incrémentale, repassez la plus grande date_modification reçue en updated_since.',
      parameters: [
        {
          description: "Borne basse inclusive sur date_modification (ISO 8601). Omis : renvoie tout l'historique.",
          in: 'query',
          name: 'updated_since',
          required: false,
          schema: { format: 'date-time', type: 'string' },
        },
      ],
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: { items: { $ref: '#/components/schemas/Demande' }, type: 'array' },
            },
          },
          description: 'Liste des demandes',
        },
        '401': { description: 'Token absent, invalide ou révoqué' },
        '429': { description: 'Trop de requêtes' },
      },
      security: [{ bearerAuth: [] }],
      summary: 'Lister les demandes de raccordement de votre organisation',
      tags: ['API partenaire'],
    },
  },
  '/v2/demands/{id}': {
    patch: {
      description: 'Seuls statut et commentaire sont modifiables ; les autres champs sont gérés par FCU et ignorés.',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { format: 'uuid', type: 'string' } }],
      requestBody: {
        content: { 'application/json': { schema: { ...jsonSchema(zPatchDemandBody), minProperties: 1 } } },
        required: true,
      },
      responses: {
        '200': {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Demande' } } },
          description: 'Demande mise à jour',
        },
        '401': { description: 'Token absent, invalide ou révoqué' },
        '404': { description: 'Demande introuvable ou hors de votre périmètre' },
        '429': { description: 'Trop de requêtes' },
      },
      security: [{ bearerAuth: [] }],
      summary: "Mettre à jour le suivi d'une demande",
      tags: ['API partenaire'],
    },
  },
};

export const buildOpenApiDocument = (): OpenAPIObject => ({
  components: {
    schemas: { Demande: jsonSchema(zDemande) },
    securitySchemes: {
      bearerAuth: {
        description: "Token d'organisation fourni par l'équipe FCU (en-tête Authorization: Bearer fcu_…).",
        scheme: 'bearer',
        type: 'http',
      },
    },
  },
  info: {
    contact: { name: 'Equipe France Chaleur Urbaine', url: 'https://france-chaleur-urbaine.beta.gouv.fr/contact' },
    description:
      "L'API France Chaleur Urbaine permet de télécharger les données et tracés des réseaux de chaleur, tester la proximité avec les réseaux, et (API partenaire authentifiée) synchroniser les demandes de raccordement avec un CRM.",
    license: { name: 'Licence Ouverte / Open Licence version 2.0', url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/' },
    termsOfService: 'https://france-chaleur-urbaine.beta.gouv.fr/mentions-legales',
    title: 'API France Chaleur Urbaine',
    version: '1.0.0',
  },
  openapi: '3.1.0',
  paths: { ...v1Paths, ...v2Paths },
  servers: [{ url: 'https://france-chaleur-urbaine.beta.gouv.fr/api' }],
  tags: [{ name: 'Informations générales' }, { name: 'API partenaire' }],
});

export const renderOpenApiYaml = (): string =>
  `# Généré par \`pnpm cli openapi:generate\` — ne pas éditer à la main.\n${toYaml(buildOpenApiDocument())}`;
