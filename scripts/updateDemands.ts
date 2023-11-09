import {
  closestNetwork,
  getConso,
  getConsoById,
  getNbLogement,
  getNbLogementById,
} from '../src/core/infrastructure/repository/addresseInformation';
import { Airtable } from '../src/types/enum/Airtable';

import base from '../src/db/airtable';

const updateDemands = async () => {
  try {
    const demands = await base(Airtable.UTILISATEURS).select().all();
    console.log(
      demands.filter(
        (demand) => demand.get('Latitude') && demand.get('Longitude')
      ).length,
      'demandes a analyser'
    );
    let i = 1;
    for (const demand of demands.filter(
      (demand) => demand.get('Latitude') && demand.get('Longitude')
    )) {
      console.log('Demande', i++);
      const latitude = demand.get('Latitude') as number;
      const longitude = demand.get('Longitude') as number;

      const newValue: any = {};
      let shouldUpdate = false;
      if (
        !demand.get('Distance au réseau') ||
        !demand.get('Identifiant réseau') ||
        !demand.get('Nom réseau')
      ) {
        const result = await closestNetwork(latitude, longitude);
        if (result.distance < 1000) {
          newValue['Distance au réseau'] = Math.round(result.distance);
          newValue['Identifiant réseau'] = result['Identifiant reseau'];
          newValue['Nom réseau'] = result.nom_reseau;
          shouldUpdate = true;
        }
      }
      if (!demand.get('Conso')) {
        const conso = await (demand.get('ID Conso')
          ? getConsoById(demand.get('Id Conso') as string)
          : getConso(latitude, longitude));
        if (conso) {
          newValue.Conso = conso.conso_nb;
          newValue['ID Conso'] = conso.rownum;
          shouldUpdate = true;
        }
      }
      if (!demand.get('Logement')) {
        const nbLogement = await (demand.get('ID BNB')
          ? getNbLogementById(
              demand.get('Id BNB') as string,
              latitude,
              longitude
            )
          : getNbLogement(latitude, longitude));

        if (nbLogement) {
          newValue.Logement = nbLogement.nb_logements;
          newValue['ID BNB'] = nbLogement.fid;
          shouldUpdate = true;
        }
      }
      if (shouldUpdate) {
        await base(Airtable.UTILISATEURS).update(demand.getId(), newValue);
      }
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

updateDemands();
