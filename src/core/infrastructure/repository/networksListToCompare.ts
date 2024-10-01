import db from 'src/db';
import { NetworkToCompare } from 'src/types/Summary/Network';

export const getNetworks = async (): Promise<NetworkToCompare[]> => {
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
    .andWhereRaw('LENGTH("Identifiant reseau") <= 5');
  return networks.map((network: NetworkToCompare) => {
    const energies = [
      { label: 'energie_ratio_biomasse', value: network.energie_ratio_biomasse },
      { label: 'energie_ratio_geothermie', value: network.energie_ratio_geothermie },
      { label: 'energie_ratio_uve', value: network.energie_ratio_uve },
      { label: 'energie_ratio_chaleurIndustrielle', value: network.energie_ratio_chaleurIndustrielle },
      { label: 'energie_ratio_solaireThermique', value: network.energie_ratio_solaireThermique },
      { label: 'energie_ratio_pompeAChaleur', value: network.energie_ratio_pompeAChaleur },
      { label: 'energie_ratio_gaz', value: network.energie_ratio_gaz },
      { label: 'energie_ratio_fioul', value: network.energie_ratio_fioul },
      { label: 'energie_ratio_autresEnr', value: network.energie_ratio_autresEnr },
      { label: 'energie_ratio_chaufferiesElectriques', value: network.energie_ratio_chaufferiesElectriques },
      { label: 'energie_ratio_charbon', value: network.energie_ratio_charbon },
      { label: 'energie_ratio_gpl', value: network.energie_ratio_gpl },
      { label: 'energie_ratio_autreChaleurRecuperee', value: network.energie_ratio_autreChaleurRecuperee },
      { label: 'energie_ratio_biogaz', value: network.energie_ratio_biogaz },
    ];
    const max = energies.reduce(function (prev, current) {
      return prev && prev.value > current.value ? prev : current;
    });
    return {
      id: network.id_fcu,
      ...network,
      energie_max_ratio: max.label,
      livraisons_totale_MWh: network['livraisons_totale_MWh'] / 1000,
      'contenu CO2 ACV': network['contenu CO2 ACV'] * 1000,
      'contenu CO2': network['contenu CO2'] * 1000,
    } as NetworkToCompare;
  });
};
