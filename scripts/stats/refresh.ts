import { writeFile } from 'node:fs/promises';

import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { prettyFormatNumber } from '@/utils/strings';
import { getDealsCountByStage } from '@cli/stats/pipedrive';

const ratioTonnesCO2ParRaccordement = 108212 / 2017; // moyenne de 30 logements par raccordement. calcué initialement avec l'ancien simulateur de CO2.

export async function refreshStatistics() {
  const [{ totalDemandes, totalRaccordements, totalLogements }, totalReseaux, pourcentageLivraisonsChaleur, nbIframes] = await Promise.all([
    getDemandesEnCoursStats(),
    getTotalReseaux(),
    getPourcentageLivraisonsChaleur(),
    getDealsCountByStage('Intégré'),
  ]);
  const lastActu = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const statisticsFilePath = 'src/data/statistics.ts';
  await writeFile(
    statisticsFilePath,
    `const statistics = {
  connection: '${prettyFormatNumber(totalRaccordements)}', // nombre de demandes pour lesquelles le statut est étude en cours, réalisé, travaux en cours ou voté en ag.
  logements: '${prettyFormatNumber(totalLogements)}', // logements concernés par les raccordements
  CO2Tons: '${prettyFormatNumber(Math.round(ratioTonnesCO2ParRaccordement * totalRaccordements))}', // tonnes de CO2 potentiellement économisées par an
  networks: '${prettyFormatNumber(totalReseaux)}', // somme des réseaux de chaleur et de froid pour lesquels has_trace est coché.
  heatPercent: '${pourcentageLivraisonsChaleur}', // se base uniquement sur les réseaux de chaleur, et est calculé en prenant les livraisons totales pour les réseaux où has_trace est coché / livraisons totales pourr tous les réseaux
  connectionPercent: '${Math.round((totalRaccordements / totalDemandes) * 100)}', // ratio connection/total des demandes de mise en contact avec un gestionnaire
  iFrameIntegration: '${nbIframes}', // prendre le chiffre indiqué sur Pipedrive dans affaires Iframe / intégrés
  lastActu: '${lastActu}',
};

export default statistics;
`
  );

  logger.info(`Le fichier ${statisticsFilePath} a été mis à jour`);
}

const getTotalReseaux = async () => {
  const reseauxDeChaleur = await kdb
    .selectFrom('reseaux_de_chaleur')
    .where('has_trace', '=', true)
    .select(({ fn }) => [fn.countAll().as('count')])
    .executeTakeFirstOrThrow();

  const reseauxDeFroid = await kdb
    .selectFrom('reseaux_de_froid')
    .where('has_trace', '=', true)
    .select(({ fn }) => [fn.countAll().as('count')])
    .executeTakeFirstOrThrow();

  return Number(reseauxDeChaleur.count) + Number(reseauxDeFroid.count);
};

const getDemandesEnCoursStats = async () => {
  const demandes = await AirtableDB(Airtable.DEMANDES)
    .select({
      fields: ['Status', 'Logement'],
    })
    .all();

  const totalDemandes = demandes.length;

  const demandesEnCours = demandes.filter((record) =>
    [DEMANDE_STATUS.IN_PROGRESS, DEMANDE_STATUS.WORK_IN_PROGRESS, DEMANDE_STATUS.DONE].includes(record.fields.Status as DEMANDE_STATUS)
  );

  const totalLogements = demandesEnCours.reduce((acc, record) => acc + Number(record.fields.Logement || 1), 0);

  return {
    totalDemandes,
    totalRaccordements: demandesEnCours.length,
    totalLogements,
  };
};

const getPourcentageLivraisonsChaleur = async () => {
  const totalLivraisonsAll = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select(({ fn }) => [fn.sum('livraisons_totale_MWh').as('total')])
    .executeTakeFirstOrThrow();

  const totalLivraisonsWithTrace = await kdb
    .selectFrom('reseaux_de_chaleur')
    .where('has_trace', '=', true)
    .select(({ fn }) => [fn.sum('livraisons_totale_MWh').as('total')])
    .executeTakeFirstOrThrow();

  const totalAll = Number(totalLivraisonsAll.total) || 0;
  const totalWithTrace = Number(totalLivraisonsWithTrace.total) || 0;

  return totalAll != 0 ? Math.round((totalWithTrace / totalAll) * 100) : 0;
};
