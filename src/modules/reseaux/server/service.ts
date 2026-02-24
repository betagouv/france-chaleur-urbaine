import type { ExpressionBuilder, RawBuilder } from 'kysely';

import { parseBbox } from '@/modules/geo/client/helpers';
import { createGeometryExpression, processGeometry } from '@/modules/geo/server/helpers';
import type { BoundingBox } from '@/modules/geo/types';
import { createWarnEligibilityChangesJob } from '@/modules/pro-eligibility-tests/server/service';
import type { ApplyGeometriesUpdatesInput } from '@/modules/reseaux/constants';
import { type NetworkTable, updateNetworkHasPDP } from '@/modules/reseaux/server/geometry-operations';
import { createBuildTilesJob, createSyncGeometriesToAirtableJob, createSyncMetadataFromAirtableJob } from '@/modules/tiles/server/service';
import { type DB, kdb, sql, type ZoneDeDeveloppementPrioritaire } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import type { Network, NetworkToCompare } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';

const logger = parentLogger.child({
  module: 'reseaux',
});

export const getNetwork = async (id: string): Promise<Network> => {
  const result = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select([
      'id_fcu',
      'Taux EnR&R',
      'Identifiant reseau',
      'communes',
      'has_trace',
      'Gestionnaire',
      'contenu CO2',
      'contenu CO2 ACV',
      'Moyenne-annee-DPE',
      'nom_reseau',
      'Rend%',
      'Dev_reseau%',
      'PM',
      'PM_L',
      'PM_T',
      'PV%',
      'PF%',
      'livraisons_totale_MWh',
      'livraisons_residentiel_MWh',
      'livraisons_tertiaire_MWh',
      'livraisons_industrie_MWh',
      'livraisons_agriculture_MWh',
      'livraisons_autre_MWh',
      'longueur_reseau',
      'nb_pdl',
      'annee_creation',
      'eau_chaude',
      'eau_surchauffee',
      'vapeur',
      'MO',
      'prod_MWh_gaz_naturel',
      'prod_MWh_charbon',
      'prod_MWh_fioul_domestique',
      'prod_MWh_fioul_lourd',
      'prod_MWh_GPL',
      'prod_MWh_biomasse_solide',
      'prod_MWh_dechets_internes',
      'prod_MWh_UIOM',
      'prod_MWh_biogaz',
      'prod_MWh_geothermie',
      'prod_MWh_PAC',
      'prod_MWh_solaire_thermique',
      'prod_MWh_chaleur_industiel',
      'prod_MWh_autre_chaleur_recuperee',
      'prod_MWh_autres_ENR',
      'prod_MWh_chaudieres_electriques',
      'prod_MWh_autres',
      'production_totale_MWh',
      'puissance_totale_MW',
      'puissance_MW_gaz_naturel',
      'puissance_MW_charbon',
      'puissance_MW_fioul_domestique',
      'puissance_MW_fioul_lourd',
      'puissance_MW_GPL',
      'puissance_MW_biomasse_solide',
      'puissance_MW_dechets_internes',
      'puissance_MW_UIOM',
      'puissance_MW_biogaz',
      'puissance_MW_geothermie',
      'puissance_MW_PAC',
      'puissance_MW_solaire_thermique',
      'puissance_MW_chaleur_industiel',
      'puissance_MW_autre_chaleur_recuperee',
      'puissance_MW_chaudieres_electriques',
      'puissance_MW_autres',
      'puissance_MW_autres_ENR',
      sql<number>`ST_X(ST_Transform(ST_Centroid(geom), 4326))`.as('lon'),
      sql<number>`ST_Y(ST_Transform(ST_Centroid(geom), 4326))`.as('lat'),
      'website_gestionnaire',
      'reseaux classes',
      'informationsComplementaires',
      'fichiers',
      'region',
      'ouvert_aux_raccordements',
    ])
    .where('Identifiant reseau', '=', id)
    .executeTakeFirst();
  return result as unknown as Network;
};

export const getColdNetwork = async (id: string): Promise<Network> => {
  const result = await kdb
    .selectFrom('reseaux_de_froid')
    .select([
      'id_fcu',
      'Taux EnR&R',
      'Identifiant reseau',
      'communes',
      'Gestionnaire',
      'contenu CO2',
      'contenu CO2 ACV',
      'Moyenne-annee-DPE',
      'nom_reseau',
      'livraisons_totale_MWh',
      'livraisons_residentiel_MWh',
      'livraisons_tertiaire_MWh',
      'livraisons_industrie_MWh',
      'livraisons_agriculture_MWh',
      'livraisons_autre_MWh',
      'production_totale_MWh',
      'puissance_totale_MW',
      'longueur_reseau',
      'nb_pdl',
      'annee_creation',
      'MO',
      sql<number>`ST_X(ST_Transform(ST_Centroid(geom), 4326))`.as('lon'),
      sql<number>`ST_Y(ST_Transform(ST_Centroid(geom), 4326))`.as('lat'),
      'website_gestionnaire',
      'informationsComplementaires',
      'fichiers',
      'Rend%',
    ])
    .where('Identifiant reseau', '=', id)
    .executeTakeFirst();
  return result as unknown as Network;
};

export const listNetworks = async (): Promise<NetworkToCompare[]> => {
  const networks = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select([
      'id_fcu',
      'Taux EnR&R',
      'Identifiant reseau',
      'has_trace',
      'Gestionnaire',
      'contenu CO2',
      'contenu CO2 ACV',
      'nom_reseau',
      'Rend%',
      'Dev_reseau%',
      'PM',
      'PM_L',
      'PM_T',
      'PV%',
      'PF%',
      'livraisons_totale_MWh',
      'livraisons_residentiel_MWh',
      'livraisons_tertiaire_MWh',
      'longueur_reseau',
      'nb_pdl',
      'annee_creation',
      'eau_chaude',
      'eau_surchauffee',
      'vapeur',
      'MO',
      'prod_MWh_gaz_naturel',
      'prod_MWh_charbon',
      'prod_MWh_fioul_domestique',
      'prod_MWh_fioul_lourd',
      'prod_MWh_GPL',
      'prod_MWh_biomasse_solide',
      'prod_MWh_dechets_internes',
      'prod_MWh_UIOM',
      'prod_MWh_biogaz',
      'prod_MWh_geothermie',
      'prod_MWh_PAC',
      'prod_MWh_solaire_thermique',
      'prod_MWh_chaleur_industiel',
      'prod_MWh_autre_chaleur_recuperee',
      'prod_MWh_chaudieres_electriques',
      'prod_MWh_autres',
      'prod_MWh_autres_ENR',
      sql<number>`ST_X(ST_Transform(ST_Centroid(geom), 4326))`.as('lon'),
      sql<number>`ST_Y(ST_Transform(ST_Centroid(geom), 4326))`.as('lat'),
      'website_gestionnaire',
      'reseaux classes',
      'informationsComplementaires',
      'fichiers',
      'region',
      'communes',
      sql<number>`"prod_MWh_biomasse_solide" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_biomasse'),
      sql<number>`"prod_MWh_geothermie" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_geothermie'),
      sql<number>`("prod_MWh_dechets_internes" + "prod_MWh_UIOM") / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as(
        'energie_ratio_uve'
      ),
      sql<number>`"prod_MWh_chaleur_industiel" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as(
        'energie_ratio_chaleurIndustrielle'
      ),
      sql<number>`"prod_MWh_solaire_thermique" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as(
        'energie_ratio_solaireThermique'
      ),
      sql<number>`"prod_MWh_PAC" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_pompeAChaleur'),
      sql<number>`"prod_MWh_gaz_naturel" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_gaz'),
      sql<number>`("prod_MWh_fioul_domestique" + "prod_MWh_fioul_lourd") / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as(
        'energie_ratio_fioul'
      ),
      sql<number>`"prod_MWh_autres_ENR" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_autresEnr'),
      sql<number>`"prod_MWh_chaudieres_electriques" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as(
        'energie_ratio_chaufferiesElectriques'
      ),
      sql<number>`"prod_MWh_charbon" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_charbon'),
      sql<number>`"prod_MWh_GPL" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_gpl'),
      sql<number>`"prod_MWh_autre_chaleur_recuperee" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as(
        'energie_ratio_autreChaleurRecuperee'
      ),
      sql<number>`"prod_MWh_biogaz" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100`.as('energie_ratio_biogaz'),
    ])
    .where('Identifiant reseau', 'is not', null)
    .where('nom_reseau', 'is not', null)
    .where(sql<boolean>`LENGTH("Identifiant reseau") <= 5`) //Some networks has format 84XXC_16 and are not ready to be displayed
    .execute();
  return networks.map((network: any) => {
    return {
      id: network.id_fcu,
      ...network,
      'contenu CO2': isDefined(network['contenu CO2']) ? network['contenu CO2'] * 1000 : null,
      'contenu CO2 ACV': isDefined(network['contenu CO2 ACV']) ? network['contenu CO2 ACV'] * 1000 : null,
      livraisons_totale_MWh: isDefined(network.livraisons_totale_MWh) ? network.livraisons_totale_MWh / 1000 : null,
    } as NetworkToCompare;
  });
};

export const listReseauxDeChaleur = async () => {
  const reseauxDeChaleur = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select([
      'id_fcu',
      'Identifiant reseau',
      'nom_reseau',
      'communes',
      'Gestionnaire',
      'MO',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(CASE WHEN ST_IsEmpty(geom_update) THEN NULL ELSE geom_update END, geom)), 4326)::box2d`.as(
        'bbox'
      ),
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(geom_update, 4326))::json ELSE NULL END`.as('geom_update'),
      'tags',
      'ouvert_aux_raccordements',
      sql<boolean>`geom_update IS NOT NULL AND ST_IsEmpty(geom_update)`.as('geom_delete'),
      sql<boolean>`geom IS NULL`.as('geom_create'),
    ])
    .orderBy('id_fcu')
    .execute();

  // transforme les bbox en JS pour être performant
  reseauxDeChaleur.forEach((reseau) => {
    reseau.bbox = parseBbox(reseau.bbox as unknown as string);
  });

  return reseauxDeChaleur;
};

export const updateTags = async (id: number, tags: string[]) => {
  await kdb.updateTable('reseaux_de_chaleur').set({ tags }).where('id_fcu', '=', id).execute();
};

export const listReseauxEnConstruction = async () => {
  const reseauxDeChaleur = await kdb
    .selectFrom('zones_et_reseaux_en_construction')
    .select([
      'id_fcu',
      'nom_reseau',
      'communes',
      'gestionnaire',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(CASE WHEN ST_IsEmpty(geom_update) THEN NULL ELSE geom_update END, geom)), 4326)::box2d`.as(
        'bbox'
      ),
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(geom_update, 4326))::json ELSE NULL END`.as('geom_update'),
      'tags',
      'ouvert_aux_raccordements',
      sql<boolean>`geom_update IS NOT NULL AND ST_IsEmpty(geom_update)`.as('geom_delete'),
      sql<boolean>`geom IS NULL`.as('geom_create'),
    ])
    .orderBy('id_fcu')
    .execute();

  // transforme les bbox en JS pour être performant
  reseauxDeChaleur.forEach((reseau) => {
    reseau.bbox = parseBbox(reseau.bbox as unknown as string);
  });

  return reseauxDeChaleur;
};

export const updateReseauEnConstruction = async (id: number, tags: string[]) => {
  await kdb.updateTable('zones_et_reseaux_en_construction').set({ tags }).where('id_fcu', '=', id).execute();
};

export const listReseauxDeFroid = async () => {
  const reseauxDeFroid = await kdb
    .selectFrom('reseaux_de_froid')
    .select([
      'id_fcu',
      'Identifiant reseau',
      'nom_reseau',
      'communes',
      'Gestionnaire',
      'MO',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(CASE WHEN ST_IsEmpty(geom_update) THEN NULL ELSE geom_update END, geom)), 4326)::box2d`.as(
        'bbox'
      ),
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(geom_update, 4326))::json ELSE NULL END`.as('geom_update'),
      sql<boolean>`geom_update IS NOT NULL AND ST_IsEmpty(geom_update)`.as('geom_delete'),
      sql<boolean>`geom IS NULL`.as('geom_create'),
    ])
    .orderBy('id_fcu')
    .execute();

  // transforme les bbox en JS pour être performant
  reseauxDeFroid.forEach((reseau) => {
    reseau.bbox = parseBbox(reseau.bbox as unknown as string);
  });

  return reseauxDeFroid;
};

export const listPerimetresDeDeveloppementPrioritaire = async () => {
  const perimetresDeDeveloppementPrioritaire = await kdb
    .selectFrom('zone_de_developpement_prioritaire')
    .select([
      'id_fcu',
      'Identifiant reseau',
      'reseau_de_chaleur_ids',
      'reseau_en_construction_ids',
      'communes',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(CASE WHEN ST_IsEmpty(geom_update) THEN NULL ELSE geom_update END, geom)), 4326)::box2d`.as(
        'bbox'
      ),
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(geom_update, 4326))::json ELSE NULL END`.as('geom_update'),
      sql<boolean>`geom_update IS NOT NULL AND ST_IsEmpty(geom_update)`.as('geom_delete'),
      sql<boolean>`geom IS NULL`.as('geom_create'),
    ])
    .orderBy('id_fcu')
    .execute();

  // transforme les bbox en JS pour être performant
  perimetresDeDeveloppementPrioritaire.forEach((perimetre) => {
    perimetre.bbox = parseBbox(perimetre.bbox as unknown as string);
  });

  return perimetresDeDeveloppementPrioritaire;
};

export const updatePerimetreDeDeveloppementPrioritaire = async (
  id: number,
  data: Partial<Pick<ZoneDeDeveloppementPrioritaire, 'Identifiant reseau' | 'reseau_de_chaleur_ids' | 'reseau_en_construction_ids'>>
) => {
  await kdb.updateTable('zone_de_developpement_prioritaire').set(data).where('id_fcu', '=', id).execute();
};

export const updateGeomUpdate = async (
  id_fcu: number,
  geometry: any,
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire' | 'reseaux_de_froid'
) => {
  const processedGeometry = await processGeometry(geometry);
  const finalGeometry = createGeometryExpression(processedGeometry.geom, processedGeometry.srid);

  await kdb
    .updateTable(dbName)
    .where('id_fcu', '=', id_fcu)
    .set({
      geom_update: finalGeometry,
    })
    .execute();
};

export const deleteGeomUpdate = async (
  id_fcu: number,
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire' | 'reseaux_de_froid'
) => {
  await kdb
    .updateTable(dbName)
    .where('id_fcu', '=', id_fcu)
    .set({
      geom_update: null,
    })
    .execute();
};

export const deleteNetwork = async (
  id_fcu: number,
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire' | 'reseaux_de_froid'
) => {
  const existingCreation = await kdb.selectFrom(dbName).where('id_fcu', '=', id_fcu).where('geom', 'is', null).executeTakeFirst();

  if (existingCreation) {
    await kdb.deleteFrom(dbName).where('id_fcu', '=', id_fcu).execute();
    logger.info(`Le réseau ${id_fcu} a été supprimé car pas encore synchronisé`);
    return;
  }

  // Create an empty GeometryCollection directly in SQL to mark as deleted
  await kdb
    .updateTable(dbName)
    .where('id_fcu', '=', id_fcu)
    .set({
      geom_update: sql`ST_GeomFromText('GEOMETRYCOLLECTION EMPTY', 4326)`,
    })
    .execute();
  logger.info(`Le réseau ${id_fcu} a été mis en attente de suppression`);
};

const createReseauDeChaleur = async (id: string, finalGeometry: RawBuilder<any>) => {
  const id_sncu = id.includes('C') || id.includes('F') ? id : null;

  // Pour les réseaux de chaleur, l'ID est l'identifiant réseau (string)
  const maxIdResult = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select(sql<number>`COALESCE(MAX(id_fcu), 0) + 1`.as('next_id'))
    .executeTakeFirstOrThrow();

  return await kdb
    .insertInto('reseaux_de_chaleur')
    .values({
      ...(id_sncu ? { 'Identifiant reseau': id_sncu, id_fcu: maxIdResult.next_id } : { id_fcu: parseInt(id, 10) }),
      fichiers: [],
      geom: null,
      geom_update: finalGeometry,
      ouvert_aux_raccordements: false,
      'reseaux classes': false,
      reseaux_techniques: false,
      tags: [],
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

const createReseauEnConstruction = async (id: string, finalGeometry: RawBuilder<any>) => {
  const id_fcu = parseInt(id, 10);
  if (Number.isNaN(id_fcu)) {
    throw new Error('ID FCU invalide');
  }

  return await kdb
    .insertInto('zones_et_reseaux_en_construction')
    .values({
      geom: null,
      geom_update: sql`ST_ForcePolygonCCW(${finalGeometry})`,
      id_fcu,
      nom_reseau: `Nouveau réseau en construction ${id_fcu}`,
      ouvert_aux_raccordements: false,
      tags: [],
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

const createPerimetreDeDeveloppementPrioritaire = async (id: string, finalGeometry: RawBuilder<any>) => {
  const id_fcu = parseInt(id, 10);
  if (Number.isNaN(id_fcu)) {
    throw new Error('ID FCU invalide');
  }

  return await kdb
    .insertInto('zone_de_developpement_prioritaire')
    .values({
      geom: null,
      geom_update: sql`ST_ForcePolygonCCW(${finalGeometry})`,
      id_fcu,
      reseau_de_chaleur_ids: [],
      reseau_en_construction_ids: [],
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

const createReseauDeFroid = async (id: string, finalGeometry: RawBuilder<any>) => {
  const id_sncu = id.includes('C') || id.includes('F') ? id : null;

  // Pour les réseaux de froid, l'ID est l'identifiant réseau (string)
  const maxIdResult = await kdb
    .selectFrom('reseaux_de_froid')
    .select(sql<number>`COALESCE(MAX(id_fcu), 0) + 1`.as('next_id'))
    .executeTakeFirstOrThrow();

  return await kdb
    .insertInto('reseaux_de_froid')
    .values({
      ...(id_sncu ? { 'Identifiant reseau': id_sncu, id_fcu: maxIdResult.next_id } : { id_fcu: parseInt(id, 10) }),
      fichiers: [],
      geom: null,
      geom_update: finalGeometry,
      'reseaux classes': false,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createNetwork = async (
  id: string,
  geometry: any,
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire' | 'reseaux_de_froid'
) => {
  const processedGeometry = await processGeometry(geometry);
  const finalGeometry = createGeometryExpression(processedGeometry.geom, processedGeometry.srid);

  switch (dbName) {
    case 'reseaux_de_chaleur':
      return await createReseauDeChaleur(id, finalGeometry);
    case 'zones_et_reseaux_en_construction':
      return await createReseauEnConstruction(id, finalGeometry);
    case 'zone_de_developpement_prioritaire':
      return await createPerimetreDeDeveloppementPrioritaire(id, finalGeometry);
    case 'reseaux_de_froid':
      return await createReseauDeFroid(id, finalGeometry);
    default:
      throw new Error(`Type de réseau non supporté: ${dbName}`);
  }
};

// ========================================
// Geometry Updates Processing
// ========================================

type TableConfig = {
  tableName: NetworkTable;
  internalName: ApplyGeometriesUpdatesInput['name'];
};

/**
 * Extrait les bounding boxes des géométries mises à jour avec un buffer
 * Optimisé avec ST_Expand qui est plus rapide que ST_Buffer pour les bbox
 * @param config Configuration de la table
 * @param bufferMeters Buffer en mètres (défaut: 1000m = 1km)
 * @returns Array de bounding boxes avec buffer appliqué
 */
async function getUpdatedNetworkBboxes(config: TableConfig, bufferMeters = 1000): Promise<BoundingBox[]> {
  const bboxes = await kdb
    .selectFrom(config.tableName)
    .select([
      sql<BoundingBox>`ST_Transform(
        ST_Expand(
          ST_Envelope(geom_update),
          ${bufferMeters}
        ),
        4326
      )::box2d`.as('bbox'),
    ])
    .where('geom_update', 'is not', null)
    .where(sql<boolean>`NOT ST_IsEmpty(geom_update)`)
    .execute();

  // Transformer les bbox en JS
  return bboxes.map((row) => parseBbox(row.bbox as unknown as string));
}

const tables: TableConfig[] = [
  {
    internalName: 'reseaux-de-chaleur',
    tableName: 'reseaux_de_chaleur',
  },
  {
    internalName: 'reseaux-de-froid',
    tableName: 'reseaux_de_froid',
  },
  {
    internalName: 'reseaux-en-construction',
    tableName: 'zones_et_reseaux_en_construction',
  },
  {
    internalName: 'perimetres-de-developpement-prioritaire',
    tableName: 'zone_de_developpement_prioritaire',
  },
];

/**
 * Expression SQL pour calculer les codes INSEE des communes intersectant une géométrie mise à jour
 */
const communesInseeExpressionGeomUpdate = sql<string[]>`COALESCE(
  (
    SELECT array_agg(insee_com order by insee_com)
    FROM ign_communes
    WHERE ST_Intersects(geom_update, ign_communes.geom_150m)
  ),
  (
    SELECT array_agg(insee_com order by insee_com)
    FROM ign_communes
    WHERE ST_Intersects(geom_update, ign_communes.geom)
  ),
  '{}'
)::text[]`;

/**
 * Définition des champs dépendants de la géométrie pour chaque table
 */
const networkTablesGeomFields: {
  [K in NetworkTable]: (eb: ExpressionBuilder<DB, K>) => Record<string, any>;
} = {
  reseaux_de_chaleur: (eb) => ({
    has_trace: sql<boolean>`st_geometrytype(${eb.ref('geom_update')}) = 'ST_MultiLineString'`,
  }),
  reseaux_de_froid: (eb) => ({
    has_trace: sql<boolean>`st_geometrytype(${eb.ref('geom_update')}) = 'ST_MultiLineString'`,
  }),
  zone_de_developpement_prioritaire: () => ({}),
  zones_et_reseaux_en_construction: (eb) => ({
    is_zone: sql<boolean>`st_geometrytype(${eb.ref('geom_update')}) = 'ST_MultiPolygon' or st_geometrytype(geom_update) = 'ST_Polygon'`,
  }),
};

/**
 * Met à jour les champs département et région pour une entité
 */
async function updateLabelsCommunesDepartementAndRegion(tableName: NetworkTable, id_fcu: number): Promise<void> {
  await kdb
    .updateTable(tableName)
    .where('id_fcu', '=', id_fcu)
    .set({
      communes: sql<string[]>`(
        SELECT array_agg(ic.nom ORDER BY ic.nom)
        FROM unnest(${sql.raw(tableName)}.communes_insee) as ci
        JOIN ign_communes ic ON ic.insee_com = ci
        WHERE ${sql.raw(tableName)}.id_fcu = ${id_fcu}
      )`,
      departement: sql<string>`(
        SELECT string_agg(DISTINCT id.nom, ', ' ORDER BY id.nom)
        FROM unnest(${sql.raw(tableName)}.communes_insee) as ci
        JOIN ign_communes ic ON ic.insee_com = ci
        JOIN ign_departements id ON id.insee_dep = ic.insee_dep
        WHERE ${sql.raw(tableName)}.id_fcu = ${id_fcu}
      )`,
      region: sql<string>`(
        SELECT string_agg(DISTINCT ir.nom, ', ' ORDER BY ir.nom)
        FROM unnest(${sql.raw(tableName)}.communes_insee) as ci
        JOIN ign_communes ic ON ic.insee_com = ci
        JOIN ign_regions ir ON ir.insee_reg = ic.insee_reg
        WHERE ${sql.raw(tableName)}.id_fcu = ${id_fcu}
      )`,
    })
    .execute();
}

const processTableGeometryUpdates = async (config: TableConfig) => {
  const [created, updated, deleted] = await Promise.all([
    // Créations (!geom && geom_update)
    kdb
      .updateTable(config.tableName)
      .set((eb) => ({
        communes_insee: communesInseeExpressionGeomUpdate,
        date_actualisation_trace: eb.val(new Date()),
        geom: eb.ref('geom_update'),
        geom_update: null,
        ...networkTablesGeomFields[config.tableName](eb),
      }))
      .where('geom', 'is', null)
      .where('geom_update', 'is not', null)
      .where(sql<boolean>`NOT ST_IsEmpty(geom_update)`)
      .returning(config.internalName === 'perimetres-de-developpement-prioritaire' ? ['id_fcu', 'Identifiant reseau'] : ['id_fcu'])
      .execute(),

    // Mises à jour (geom && geom_update)
    kdb
      .updateTable(config.tableName)
      .set((eb) => ({
        communes_insee: communesInseeExpressionGeomUpdate,
        date_actualisation_trace: eb.val(new Date()),
        geom: eb.ref('geom_update'),
        geom_update: null,
        ...networkTablesGeomFields[config.tableName](eb),
      }))
      .where('geom', 'is not', null)
      .where('geom_update', 'is not', null)
      .where(sql<boolean>`NOT ST_IsEmpty(geom_update)`)
      .returning('id_fcu')
      .execute(),

    // Suppressions (geom_update vide)
    kdb
      .deleteFrom(config.tableName)
      .where('geom_update', 'is not', null)
      .where(sql<boolean>`ST_IsEmpty(geom_update)`)
      .returning('id_fcu')
      .execute(),
  ]);

  // Met à jour les labels pour les entités créées et modifiées
  const allUpdatedIds = [...created, ...updated];
  await Promise.all(allUpdatedIds.map((entity) => updateLabelsCommunesDepartementAndRegion(config.tableName, entity.id_fcu)));

  // Cas particulier : on doit mettre à jour has_PDP des réseaux de chaleur associés
  if (config.internalName === 'perimetres-de-developpement-prioritaire') {
    await Promise.all(
      created.map((createdPDP) => createdPDP['Identifiant reseau'] && updateNetworkHasPDP(createdPDP['Identifiant reseau']))
    );
  }

  return {
    config,
    created: created.length,
    deleted: deleted.length,
    total: created.length + updated.length + deleted.length,
    updated: updated.length,
  };
};

export const applyGeometriesUpdates = async ({ name }: ApplyGeometriesUpdatesInput, context: ApiContext) => {
  const networkTableConfig = tables.find((table) => table.internalName === name);
  if (!networkTableConfig) {
    throw new Error(`Table ${name} not found`);
  }

  // Récupérer les bboxes des géométries modifiées AVANT le traitement
  // Ces bboxes incluent un buffer de 1km pour détecter les adresses affectées
  const affectedBboxes = await getUpdatedNetworkBboxes(networkTableConfig, 1000);
  logger.info(`Detected ${affectedBboxes.length} geometry updates with 1km buffer for eligibility checks`);

  const updateResults = await processTableGeometryUpdates(networkTableConfig);

  // Récupère les statistiques
  const processed = {
    created: updateResults.created,
    deleted: updateResults.deleted,
    total: updateResults.total,
    updated: updateResults.updated,
  };

  const rebuildingJobIds = [
    // pas d'onglet airtable pour les PDP
    ...(name !== 'perimetres-de-developpement-prioritaire'
      ? [(await createSyncGeometriesToAirtableJob({ name }, context)).id, (await createSyncMetadataFromAirtableJob({ name }, context)).id]
      : []),
    (await createBuildTilesJob({ name }, context)).id,
  ];

  // Step 4: Créer un job pour vérifier l'éligibilité dans les zones affectées
  if (affectedBboxes.length > 0) {
    const eligibilityCheckJob = await createWarnEligibilityChangesJob(affectedBboxes, context);
    logger.info(`Created eligibility check job ${eligibilityCheckJob.id} for ${affectedBboxes.length} affected zones`);
  }

  return {
    jobIds: rebuildingJobIds,
    processed,
  };
};

/**
 * Récupère la géométrie d'un réseau au format GeoJSON
 */
export async function getNetworkGeometry(tableName: NetworkTable, id_fcu: number) {
  const result = await kdb
    .selectFrom(tableName)
    .select(sql<GeoJSON.Geometry>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geometry'))
    .where('id_fcu', '=', id_fcu)
    .where('geom', 'is not', null)
    .executeTakeFirstOrThrow();
  return result.geometry;
}
