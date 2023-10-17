import { FieldSet } from 'airtable/lib/field_set';
import { Record } from 'airtable';
import db from '../src/db';
import base from '../src/db/airtable';
import {
  DataType,
  DatabaseTileInfo,
  tilesInfo,
} from '../src/services/tiles.config';
import { fillTiles } from './utils/tiles';

const getValue = (network: Record<FieldSet>, key: string) => {
  const value = network.get(key);
  return value === 'NULL' ? null : value;
};

const getBooleanValue = (network: Record<FieldSet>, key: string) => {
  const value = getValue(network, key);
  return value === undefined ? false : value;
};

const valuesToUdpate = (table: DataType, network: Record<FieldSet>) => {
  if (table === 'network' || table === 'coldNetwork') {
    return {
      commentaires: getValue(network, 'commentaires'),
      'Taux EnR&R': getValue(network, 'Taux EnR&R'),
      'Identifiant reseau': getValue(network, 'Identifiant reseau'),
      Gestionnaire: getValue(network, 'Gestionnaire'),
      communes: getValue(network, 'communes'),
      date: getValue(network, 'date'),
      'contenu CO2': getValue(network, 'contenu CO2'),
      'contenu CO2 ACV': getValue(network, 'contenu CO2 ACV'),
      PM: getValue(network, 'PM'),
      'PV%': getValue(network, 'PV%'),
      'PF%': getValue(network, 'PF%'),
      PM_L: getValue(network, 'PM_L'),
      PM_T: getValue(network, 'PM_T'),
      'Rend%': getValue(network, 'Rend%'),
      reseaux_techniques: getBooleanValue(network, 'reseaux_techniques'),
      nom_reseau: getValue(network, 'nom_reseau'),
      departement: getValue(network, 'departement'),
      region: getValue(network, 'region'),
      MO: getValue(network, 'MO'),
      adresse_mo: getValue(network, 'adresse_mo'),
      annee_creation: getValue(network, 'annee_creation'),
      ville_mo: getValue(network, 'ville_mo'),
      adresse_gestionnaire: getValue(network, 'adresse_gestionnaire'),
      ville_gestionnaire: getValue(network, 'ville_gestionnaire'),
      longueur_reseau: getValue(network, 'longueur_reseau'),
      nb_pdl: getValue(network, 'nb_pdl'),
      prod_MWh_gaz_naturel: getValue(network, 'prod_MWh_gaz_naturel'),
      prod_MWh_charbon: getValue(network, 'prod_MWh_charbon'),
      prod_MWh_fioul_domestique: getValue(network, 'prod_MWh_fioul_domestique'),
      prod_MWh_fioul_lourd: getValue(network, 'prod_MWh_fioul_lourd'),
      prod_MWh_GPL: getValue(network, 'prod_MWh_GPL'),
      prod_MWh_biomasse_solide: getValue(network, 'prod_MWh_biomasse_solide'),
      prod_MWh_dechets_internes: getValue(network, 'prod_MWh_dechets_internes'),
      prod_MWh_UIOM: getValue(network, 'prod_MWh_UIOM'),
      prod_MWh_biogaz: getValue(network, 'prod_MWh_biogaz'),
      prod_MWh_geothermie: getValue(network, 'prod_MWh_geothermie'),
      prod_MWh_PAC_ENR: getValue(network, 'prod_MWh_PAC_ENR'),
      prod_MWh_PAC_nonENR: getValue(network, 'prod_MWh_PAC_nonENR'),
      prod_MWh_solaire_thermique: getValue(
        network,
        'prod_MWh_solaire_thermique'
      ),
      prod_MWh_chaleur_industiel: getValue(
        network,
        'prod_MWh_chaleur_industiel'
      ),
      prod_MWh_autre_chaleur_recuperee_ENR: getValue(
        network,
        'prod_MWh_autre_chaleur_recuperee_ENR'
      ),
      prod_MWh_autre_chaleur_recuperee_nonENR: getValue(
        network,
        'prod_MWh_autre_chaleur_recuperee_nonENR'
      ),
      prod_MWh_chaudieres_electriques: getValue(
        network,
        'prod_MWh_chaudieres_electriques'
      ),
      prod_MWh_autre_RCU_ENR: getValue(network, 'prod_MWh_autre_RCU_ENR'),
      prod_MWh_autre_RCU_nonENR: getValue(network, 'prod_MWh_autre_RCU_nonENR'),
      prod_MWh_autres_ENR: getValue(network, 'prod_MWh_autres_ENR'),
      prod_MWh_autres_nonENR: getValue(network, 'prod_MWh_autres_nonENR'),
      livraisons_tertiaire_MWh: getValue(network, 'livraisons_tertiaire_MWh'),
      livraisons_industrie_MWh: getValue(network, 'livraisons_industrie_MWh'),
      livraisons_agriculture_MWh: getValue(
        network,
        'livraisons_agriculture_MWh'
      ),
      livraisons_autre_MWh: getValue(network, 'livraisons_autre_MWh'),
      '%_fluide_caloporteur_eau_chaude': getValue(
        network,
        '%_fluide_caloporteur_eau_chaude'
      ),
      '%_fluide_caloporteur_eau_surchauffee': getValue(
        network,
        '%_fluide_caloporteur_eau_surchauffee'
      ),
      '%_fluide_caloporteur_vapeur': getValue(
        network,
        '%_fluide_caloporteur_vapeur'
      ),
      production_totale_MWh: getValue(network, 'production_totale_MWh'),
      livraisons_totale_MWh: getValue(network, 'livraisons_totale_MWh'),
      livraisons_residentiel_MWh: getValue(
        network,
        'livraisons_residentiel_MWh'
      ),
      'reseaux classes': getBooleanValue(network, 'reseaux classes'),
      website_gestionnaire: getValue(network, 'website_gestionnaire'),
      CP_MO: getValue(network, 'CP_MO'),
      CP_gestionnaire: getValue(network, 'CP_gestionnaire'),
      has_trace: getBooleanValue(network, 'has_trace'),
    };
  }

  return {
    mise_en_service: getValue(network, 'mise_en_service'),
    gestionnaire: getValue(network, 'gestionnaire'),
    communes: getValue(network, 'communes'),
    is_zone: getBooleanValue(network, 'is_zone'),
  };
};

const downloadNetworks = async (table: DataType) => {
  try {
    const tileInfo = tilesInfo[table] as DatabaseTileInfo;
    if (!tileInfo || !tileInfo.airtable) {
      console.log(`${table} not managed`);
      return;
    }

    const networks = await base(tileInfo.airtable).select().all();
    console.log(`Update ${networks.length} networks`);
    await Promise.all(
      networks.map((network) =>
        db(tileInfo.table)
          .update(valuesToUdpate(table, network))
          .where('id_fcu', getValue(network, 'id_fcu'))
      )
    );

    console.log('Delete tiles');
    await db(tileInfo.tiles).delete();

    await fillTiles(table, 0, 17, false);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

if (process.argv.length !== 3) {
  console.info(
    'Usage: export NODE_PATH=./ && npx ts-node scripts/downloadNetworks.ts table'
  );
  process.exit(1);
}

const table = process.argv[2];

downloadNetworks(table as DataType);
