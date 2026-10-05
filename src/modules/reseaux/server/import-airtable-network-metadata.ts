import type { Command } from '@commander-js/extra-typings';
import type { Record } from 'airtable';
import type { FieldSet } from 'airtable/lib/field_set';

import { FEDENE_EDITION_YEAR } from '@/modules/data/server/imports/donnees-reseaux-bibliotheque-fedene';
import { isPrixReseauCommunique } from '@/modules/reseaux/constants';
import { syncLinkedNetworkFields } from '@/modules/reseaux/server/linked-fields-sync';
import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';

/** One-off migration of the network metadata still held in Airtable (survey figures), run once before Airtable is cut. */
const sources = [
  { airtable: Airtable.NETWORKS, networkType: 'reseau_de_chaleur', table: 'reseaux_de_chaleur' },
  { airtable: Airtable.COLD_NETWORKS, networkType: 'reseau_de_froid', table: 'reseaux_de_froid' },
] as const;
type Source = (typeof sources)[number];

export const TypeBool: unique symbol = Symbol('bool');
export const TypeNumber: unique symbol = Symbol('number');
export const TypePrice: unique symbol = Symbol('price');
export const TypeString: unique symbol = Symbol('string');

export type Type = typeof TypeBool | typeof TypeNumber | typeof TypePrice | typeof TypeString;

// reseaux classes, ouvert_aux_raccordements, website_gestionnaire and informationsComplementaires are FCU-admin owned (never
// imported); Gestionnaire, MO and nom_reseau are split into their survey / FCU provenance by `splitProvenance` (one-shot import).
// Documents (ex "fichiers") live in network_files.
// contenu CO2, contenu CO2 ACV, Taux EnR&R and Moyenne-annee-DPE come from the yearly arrêté DPE import (data import arrete-dpe)
const conversionConfigReseauxDeChaleur = {
  // departement: TypeString,
  // region: TypeString,
  annee_creation: TypeNumber,
  'Dev_reseau%': TypeNumber,
  eau_chaude: TypeString,
  eau_surchauffee: TypeString,
  has_PDP: TypeBool,
  // id_fcu: TypeNumber,
  // id: TypeNumber,
  'Identifiant reseau': TypeString,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  longueur_reseau: TypeNumber,
  // communes: TypeStringToArray,
  nb_pdl: TypeNumber,
  'PF%': TypeNumber,
  PM: TypePrice,
  PM_L: TypePrice,
  PM_T: TypePrice,
  'PV%': TypeNumber,
  prod_MWh_autre_chaleur_recuperee: TypeNumber,
  prod_MWh_autres: TypeNumber,
  prod_MWh_autres_ENR: TypeNumber,
  prod_MWh_biogaz: TypeNumber,
  prod_MWh_biomasse_solide: TypeNumber,
  prod_MWh_chaleur_industiel: TypeNumber,
  prod_MWh_charbon: TypeNumber,
  prod_MWh_chaudieres_electriques: TypeNumber,
  prod_MWh_dechets_internes: TypeNumber,
  prod_MWh_fioul_domestique: TypeNumber,
  prod_MWh_fioul_lourd: TypeNumber,
  prod_MWh_GPL: TypeNumber,
  prod_MWh_gaz_naturel: TypeNumber,
  prod_MWh_geothermie: TypeNumber,
  prod_MWh_PAC: TypeNumber,
  prod_MWh_solaire_thermique: TypeNumber,
  prod_MWh_UIOM: TypeNumber,
  production_totale_MWh: TypeNumber,
  puissance_MW_autre_chaleur_recuperee: TypeNumber,
  puissance_MW_autres: TypeNumber,
  puissance_MW_autres_ENR: TypeNumber,
  puissance_MW_biogaz: TypeNumber,
  puissance_MW_biomasse_solide: TypeNumber,
  puissance_MW_chaleur_industiel: TypeNumber,
  puissance_MW_charbon: TypeNumber,
  puissance_MW_chaudieres_electriques: TypeNumber,
  puissance_MW_dechets_internes: TypeNumber,
  puissance_MW_fioul_domestique: TypeNumber,
  puissance_MW_fioul_lourd: TypeNumber,
  puissance_MW_GPL: TypeNumber,
  puissance_MW_gaz_naturel: TypeNumber,
  puissance_MW_geothermie: TypeNumber,
  puissance_MW_PAC: TypeNumber,
  puissance_MW_solaire_thermique: TypeNumber,
  puissance_MW_UIOM: TypeNumber,
  puissance_totale_MW: TypeNumber,
  'Rend%': TypeNumber,
  //has_trace: TypeBool,
  // date_actualisation_trace: TypeString,
  // date_actualisation_pdp: TypeString,
  //'non ref 2022': TypeBool,
  reseaux_techniques: TypeBool,
  vapeur: TypeString,
} as const;

// Same ownership rule as réseaux de chaleur (admin-owned fields never imported)
const conversionConfigReseauxDeFroid = {
  annee_creation: TypeNumber,
  // communes: TypeStringToArray,
  // id_fcu: TypeNumber,
  'Identifiant reseau': TypeString,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  longueur_reseau: TypeNumber,
  // departement: TypeString,
  // region: TypeString,
  nb_pdl: TypeNumber,
  production_totale_MWh: TypeNumber,
  puissance_totale_MW: TypeNumber,
  'Rend%': TypeNumber,
  //'non ref 2022': TypeBool,
  //has_trace: TypeBool,
  // date_actualisation_trace: TypeString,
} as const;

/**
 * Copies the survey figures of every network from Airtable to the base, and splits the provenance of the name, gestionnaire
 * and MO: the FEDENE per-edition columns (`Gestionnaire_<année>`, `MO_<année>`, `nom_reseau_<année>`) go to `*_fedene`, and the
 * Airtable value goes to `*_fcu` only when it differs from the survey (a FCU correction). Idempotent.
 */
export const importAirtableNetworkMetadata = async ({ dryRun }: { dryRun: boolean }) => {
  for (const source of sources) {
    const networksAirtable = await AirtableDB(source.airtable).select().all();
    const logger = parentLogger.child({ count: networksAirtable.length, table: source.table });
    logger.info('start airtable metadata import');
    let updated = 0;
    let corrections = 0;
    for (const network of networksAirtable) {
      const idFcu = network.get('id_fcu') as number | undefined;
      if (!idFcu) {
        continue;
      }
      const values = convertEntityFromAirtableToPostgres(source, network);
      const provenance = {
        ...splitProvenance('gestionnaire', network.get(`Gestionnaire_${FEDENE_EDITION_YEAR}`), network.get('Gestionnaire')),
        ...splitProvenance('mo', network.get(`MO_${FEDENE_EDITION_YEAR}`), network.get('MO')),
        ...splitProvenance('nom_reseau', network.get(`nom_reseau_${FEDENE_EDITION_YEAR}`), network.get('nom_reseau')),
      };
      const correctionCount = [provenance.gestionnaire_fcu, provenance.mo_fcu, provenance.nom_reseau_fcu].filter(
        (value) => value !== null
      ).length;
      logger.info(`${dryRun ? '[dry-run] ' : ''}id_fcu ${idFcu}`, { corrections: correctionCount, values: Object.keys(values).length });
      updated++;
      corrections += correctionCount;
      if (dryRun) {
        continue;
      }
      const result = await kdb
        .updateTable(source.table)
        .set({ ...values, ...provenance })
        .where('id_fcu', '=', idFcu)
        .executeTakeFirst();
      if (Number(result.numUpdatedRows) === 0) {
        logger.warn('network unknown to the base, skipped', { idFcu });
      }
    }
    logger.info('end airtable metadata import', { corrections, updated });
  }
  if (!dryRun) {
    // Re-derive the link-dependent fields (extension SNCU mirror, PDP operator auto-fill) after the import
    await syncLinkedNetworkFields();
  }
};

export const registerImportAirtableNetworkMetadataCommand = (program: Command) => {
  program
    .command('reseaux:import-airtable-metadata')
    .description(
      "Reprend une dernière fois les données d'enquête des réseaux de chaleur et de froid depuis Airtable vers la base (idempotent)"
    )
    .option('--dry-run', 'Liste les réseaux sans écrire', false)
    .action(async (options) => {
      await importAirtableNetworkMetadata({ dryRun: options.dryRun });
    });
};

const normalizeValue = (value: unknown) => toStringOrNull(value)?.trim().toLowerCase() ?? '';

/**
 * `*_fedene` = the survey column of the edition (falls back on the Airtable value when the survey column is empty: the
 * Airtable value was the survey one unless the bizdev changed it), `*_fcu` = the Airtable value when it differs from the survey.
 */
const splitProvenance = <Field extends 'gestionnaire' | 'mo' | 'nom_reseau'>(field: Field, surveyRaw: unknown, airtableRaw: unknown) => {
  const survey = toStringOrNull(surveyRaw) ?? toStringOrNull(airtableRaw);
  const airtable = toStringOrNull(airtableRaw);
  const isCorrection = airtable !== null && normalizeValue(airtable) !== normalizeValue(survey);
  return { [`${field}_fedene`]: survey, [`${field}_fcu`]: isCorrection ? airtable : null } as {
    [K in `${Field}_fedene` | `${Field}_fcu`]: string | null;
  };
};

const toStringOrNull = (value: unknown) =>
  value === undefined || value === null || value === '' || value === 'NULL' ? null : String(value);

/**
 * Convertit un réseau Airtable au format Postgres.
 * Les noms de colonne sont identiques, seuls les types sont corrigés et nettoyés.
 */
function convertEntityFromAirtableToPostgres(source: Source, airtableNetwork: Record<FieldSet>) {
  const conversionConfig = source.table === 'reseaux_de_chaleur' ? conversionConfigReseauxDeChaleur : conversionConfigReseauxDeFroid;

  return Object.entries(conversionConfig).reduce((acc, [key, type]) => {
    acc[key] = convertAirtableValue(airtableNetwork.get(key), type);
    return acc;
  }, {} as any);
}

/**
 * Convertit et corrige le potentiel mauvais typage côté Airtable.
 */
function convertAirtableValue(value: any, type: Type) {
  switch (type) {
    case TypeBool:
      return value !== undefined && value !== null ? !!value : false;
    case TypeNumber:
      return value !== undefined && value !== null && value !== 'NULL' ? value : null;
    case TypePrice: {
      // a price below the "communicated" threshold (0 €, cents) is normalized to null; parse numerically to catch Airtable text values
      const price = Number(value);
      return value !== undefined && value !== null && isPrixReseauCommunique(price) ? price : null;
    }
    case TypeString:
      return value !== undefined && value !== null && value !== 'NULL' ? value : null;
    default:
      throw new Error(`invalid type ${type}`);
  }
}
