import type { AirtableLegacyRecord } from '@/modules/demands/types';
import type { NetworkType } from '@/modules/reseaux/constants';

import { type DemandDTO, labelToStatut } from '../schema';

/** Ligne DB minimale nécessaire au mapping (cf. `baseDemandQuery` dans handlers). */
export type DemandRow = {
  id: string;
  created_at: Date | string;
  updated_at: Date | string;
  network_id: number;
  network_type: NetworkType;
  comment_gestionnaire: string | null;
  legacy_values: AirtableLegacyRecord;
  network_name: string | null;
  network_sncu_id: string | null;
  commune_code: string | null;
  departement_code: string | null;
  region_code: string | null;
};

const toISO = (value: Date | string): string => (value instanceof Date ? value : new Date(value)).toISOString();

/** Date legacy → `Date` valide, sinon `null`. */
const toValidDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** JSONB → number robuste (gère `null`/`''`/chaîne numérique). */
const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const bool = (value: unknown): boolean => value === true || value === 'true' || value === 'Oui';

/** Mappe une demande interne (colonnes + `legacy_values` Airtable) vers le contrat partenaire `zDemande`. */
export const toDemandDTO = (row: DemandRow): DemandDTO => {
  const lv = row.legacy_values;
  return {
    batiment: {
      energie_chauffage: lv['Mode de chauffage'] ?? null,
      etablissement: lv.Établissement ?? null,
      nombre_logements: num(lv['Gestionnaire Logement']) ?? num(lv.Logement),
      surface_m2: num(lv['Surface en m2']),
      type_chauffage: lv['Type de chauffage'] ?? null,
      type_structure: lv.Structure ?? null,
    },
    commentaire: row.comment_gestionnaire,
    contact: {
      email: lv.Mail ?? null,
      nom: lv.Nom ?? null,
      prenom: lv.Prénom ?? null,
      telephone: lv.Téléphone ?? null,
    },
    date_creation: toISO(toValidDate(lv['Date de la demande']) ?? row.created_at),
    date_modification: toISO(row.updated_at),
    eligibilite: {
      dans_pdp: lv['en PDP'] === 'Oui',
      distance_reseau_m: num(lv['Distance au réseau']),
      eligible: bool(lv.Éligibilité),
    },
    id: row.id,
    localisation: {
      adresse: lv.Adresse ?? null,
      code_postal: lv['Code Postal'] ?? null,
      commune_code: row.commune_code,
      commune_label: lv.Ville ?? null,
      departement_code: row.departement_code,
      departement_label: lv.Departement ?? null,
      latitude: num(lv.Latitude),
      longitude: num(lv.Longitude),
      region_code: row.region_code,
      region_label: lv.Region ?? null,
    },
    reseau: { id_fcu: row.network_id, identifiant_sncu: row.network_sncu_id, nom: row.network_name, type: row.network_type },
    statut: labelToStatut(lv.Status),
  };
};
