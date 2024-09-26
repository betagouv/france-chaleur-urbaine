import db from 'src/db';
import { NetworkToCompare } from 'src/types/Summary/Network';

export const getNetworks = async (): Promise<NetworkToCompare[]> => {
  const networks = await db('reseaux_de_chaleur').select(
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
  );
  return networks.map((network) => {
    return { id: network.id_fcu, ...network } as NetworkToCompare;
  });
};
