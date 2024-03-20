import db from 'src/db';
import { Network } from 'src/types/Summary/Network';

export const getNetwork = (id: string): Promise<Network> =>
  db('reseaux_de_chaleur')
    .select(
      'Taux EnR&R',
      'Identifiant reseau',
      'Gestionnaire',
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
      'adresse_gestionnaire',
      'CP_gestionnaire',
      'ville_gestionnaire',
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
      'fichiers'
    )
    .where('Identifiant reseau', id)
    .first();

export const getColdNetwork = (id: string): Promise<Network> =>
  db('reseaux_de_froid')
    .select(
      'Taux EnR&R',
      'Identifiant reseau',
      'Gestionnaire',
      'contenu CO2 ACV',
      'nom_reseau',
      'livraisons_totale_MWh',
      'livraisons_residentiel_MWh',
      'livraisons_tertiaire_MWh',
      'longueur_reseau',
      'nb_pdl',
      'annee_creation',
      'MO',
      'adresse_mo',
      'CP_MO',
      'ville_mo',
      'adresse_gestionnaire',
      'CP_gestionnaire',
      'ville_gestionnaire',
      db.raw('ST_X(ST_Transform(ST_Centroid(geom), 4326)) as lon'),
      db.raw('ST_Y(ST_Transform(ST_Centroid(geom), 4326)) as lat'),
      'website_gestionnaire',
      'informationsComplementaires',
      'fichiers'
    )
    .where('Identifiant reseau', id)
    .first();
