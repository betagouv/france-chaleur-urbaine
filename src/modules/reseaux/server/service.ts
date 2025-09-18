import db from '@/server/db';
import { kdb, sql, type ZoneDeDeveloppementPrioritaire } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { type BoundingBox } from '@/types/Coords';
import { type Network, type NetworkToCompare } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';
import { parseBbox } from '@/utils/geo';
import { createGeometryExpression, processGeometry } from '@cli/helpers/geo';

const logger = parentLogger.child({
  module: 'reseaux',
});

export const getNetwork = (id: string): Promise<Network> =>
  db('reseaux_de_chaleur')
    .select(
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
      'adresse_mo',
      'CP_MO',
      'ville_mo',
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
      db.raw('ST_X(ST_Transform(ST_Centroid(geom), 4326)) as lon'),
      db.raw('ST_Y(ST_Transform(ST_Centroid(geom), 4326)) as lat'),
      'website_gestionnaire',
      'reseaux classes',
      'informationsComplementaires',
      'fichiers',
      'region'
    )
    .where('Identifiant reseau', id)
    .first();

export const getColdNetwork = (id: string): Promise<Network> =>
  db('reseaux_de_froid')
    .select(
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
      'adresse_mo',
      'CP_MO',
      'ville_mo',
      db.raw('ST_X(ST_Transform(ST_Centroid(geom), 4326)) as lon'),
      db.raw('ST_Y(ST_Transform(ST_Centroid(geom), 4326)) as lat'),
      'website_gestionnaire',
      'informationsComplementaires',
      'fichiers',
      'Rend%'
    )
    .where('Identifiant reseau', id)
    .first();

export const listNetworks = async (): Promise<NetworkToCompare[]> => {
  const networks = await db('reseaux_de_chaleur')
    .select(
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
      'adresse_mo',
      'CP_MO',
      'ville_mo',
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
      db.raw('ST_X(ST_Transform(ST_Centroid(geom), 4326)) as lon'),
      db.raw('ST_Y(ST_Transform(ST_Centroid(geom), 4326)) as lat'),
      'website_gestionnaire',
      'reseaux classes',
      'informationsComplementaires',
      'fichiers',
      'region',
      'communes',
      db.raw('"prod_MWh_biomasse_solide" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_biomasse"'),
      db.raw('"prod_MWh_geothermie" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_geothermie"'),
      db.raw(
        '("prod_MWh_dechets_internes" + "prod_MWh_UIOM") / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_uve"'
      ),
      db.raw('"prod_MWh_chaleur_industiel" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_chaleurIndustrielle"'),
      db.raw('"prod_MWh_solaire_thermique" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_solaireThermique"'),
      db.raw('"prod_MWh_PAC" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_pompeAChaleur"'),
      db.raw('"prod_MWh_gaz_naturel" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_gaz"'),
      db.raw(
        '("prod_MWh_fioul_domestique" + "prod_MWh_fioul_lourd") / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_fioul"'
      ),
      db.raw('"prod_MWh_autres_ENR" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_autresEnr"'),
      db.raw(
        '"prod_MWh_chaudieres_electriques" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_chaufferiesElectriques"'
      ),
      db.raw('"prod_MWh_charbon" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_charbon"'),
      db.raw('"prod_MWh_GPL" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_gpl"'),
      db.raw(
        '"prod_MWh_autre_chaleur_recuperee" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_autreChaleurRecuperee"'
      ),
      db.raw('"prod_MWh_biogaz" / COALESCE(NULLIF("production_totale_MWh", 0), 1) * 100 as "energie_ratio_biogaz"')
    )
    .whereNotNull('Identifiant reseau')
    .and.whereNotNull('nom_reseau')
    .andWhereRaw('LENGTH("Identifiant reseau") <= 5'); //Some networks has format 84XXC_16 and are not ready to be displayed
  return networks.map((network: NetworkToCompare) => {
    return {
      id: network.id_fcu,
      ...network,
      livraisons_totale_MWh: isDefined(network['livraisons_totale_MWh']) ? network['livraisons_totale_MWh'] / 1000 : null,
      'contenu CO2 ACV': isDefined(network['contenu CO2 ACV']) ? network['contenu CO2 ACV'] * 1000 : null,
      'contenu CO2': isDefined(network['contenu CO2']) ? network['contenu CO2'] * 1000 : null,
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
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom_update, 4326)))::json ELSE NULL END`.as(
        'geom_update'
      ),
      'tags',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(geom_update, geom)), 4326)::box2d`.as('bbox'),
      sql<boolean>`geom_update IS NOT NULL AND GeometryType(geom_update) = 'GEOMETRYCOLLECTION' AND ST_IsEmpty(geom_update)`.as(
        'geom_delete'
      ),
      sql<boolean>`geom IS NULL`.as('geom_create'),
    ])
    .orderBy('id_fcu')
    .execute();

  // transforme les bbox en JS pour être performant
  reseauxDeChaleur.forEach((reseau) => {
    reseau.bbox = parseBbox(
      (reseau.bbox as unknown as string) || 'BOX(3.385585947402232 47.35474249860378,3.38691096486787 47.35645923457523)'
    );
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
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom_update, 4326)))::json ELSE NULL END`.as(
        'geom_update'
      ),
      'tags',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(geom_update, geom)), 4326)::box2d`.as('bbox'),
      sql<boolean>`geom_update IS NOT NULL AND GeometryType(geom_update) = 'GEOMETRYCOLLECTION' AND ST_IsEmpty(geom_update)`.as(
        'geom_delete'
      ),
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

export const listPerimetresDeDeveloppementPrioritaire = async () => {
  const perimetresDeDeveloppementPrioritaire = await kdb
    .selectFrom('zone_de_developpement_prioritaire')
    .select([
      'id_fcu',
      'Identifiant reseau',
      'reseau_de_chaleur_ids',
      'reseau_en_construction_ids',
      'communes',
      sql<BoundingBox>`st_transform(ST_Envelope(COALESCE(geom_update, geom)), 4326)::box2d`.as('bbox'),
      sql<any>`CASE WHEN geom_update IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(geom_update, 4326))::json ELSE NULL END`.as('geom_update'),
      sql<boolean>`geom_update IS NOT NULL AND GeometryType(geom_update) = 'GEOMETRYCOLLECTION' AND ST_IsEmpty(geom_update)`.as(
        'geom_delete'
      ),
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
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire'
) => {
  const processedGeometry = await processGeometry(geometry);
  const finalGeometry = createGeometryExpression(processedGeometry.geom, processedGeometry.srid);

  await kdb
    .with('geometry', (db) => db.selectNoFrom(finalGeometry.as('geom')))
    .updateTable(dbName)
    .where('id_fcu', '=', id_fcu)
    .set((eb) => ({
      geom_update: sql`ST_Force2D(${eb.selectFrom('geometry').select('geometry.geom')})`,
    }))
    .execute();
};

export const deleteGeomUpdate = async (
  id_fcu: number,
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire'
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
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire'
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

const createReseauDeChaleur = async (id: string, finalGeometry: any) => {
  const id_sncu = id.includes('C') || id.includes('F') ? id : null;

  // Pour les réseaux de chaleur, l'ID est l'identifiant réseau (string)
  const maxIdResult = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select(sql<number>`COALESCE(MAX(id_fcu), 0) + 1`.as('next_id'))
    .executeTakeFirstOrThrow();

  return await kdb
    .insertInto('reseaux_de_chaleur')
    .values({
      ...(id_sncu ? { 'Identifiant reseau': id_sncu, id_fcu: maxIdResult.next_id } : { id_fcu: parseInt(id) }),
      geom: null,
      tags: [],
      geom_update: sql`ST_Force2D(${finalGeometry})`,
      'reseaux classes': false,
      reseaux_techniques: false,
      fichiers: [],
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

const createReseauEnConstruction = async (id: string, finalGeometry: any) => {
  const id_fcu = parseInt(id);
  if (isNaN(id_fcu)) {
    throw new Error('ID FCU invalide');
  }

  return await kdb
    .insertInto('zones_et_reseaux_en_construction')
    .values({
      id_fcu,
      geom: null,
      geom_update: sql`ST_Force2D(${finalGeometry})`,
      nom_reseau: `Nouveau réseau en construction ${id_fcu}`,
      tags: [],
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

const createPerimetreDeDeveloppementPrioritaire = async (id: string, finalGeometry: any) => {
  const id_fcu = parseInt(id);
  if (isNaN(id_fcu)) {
    throw new Error('ID FCU invalide');
  }

  return await kdb
    .insertInto('zone_de_developpement_prioritaire')
    .values({
      id_fcu,
      geom: null,
      geom_update: sql`ST_Force2D(${finalGeometry})`,
      reseau_de_chaleur_ids: [],
      reseau_en_construction_ids: [],
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createNetwork = async (
  id: string,
  geometry: any,
  dbName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire'
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
    default:
      throw new Error(`Type de réseau non supporté: ${dbName}`);
  }
};
