import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { BaseAdapter } from '../base';
import { loadDataFromFile } from '../utils';

export interface CSVEtudeEnCours {
  'Code INSEE': number;
  EtudeId: number;
  Commune: string;
  "Maître d'ouvrage  "?: string;
  'Ne Pas Afficher'?: string;
  "Présence d'un RCU ": string;
  'Etudes réalisées': string;
  'Type de date': string;
  'Date (mois / année)': string;
  "Etude à l'échelle d'une seule commune ?": string;
  "Liste des communes de l'étude"?: string;
  'Etude en cours / étude réalisée (pour FCU)': string;
  'Date lancement du projet / étude pour FCU (mois / année)': string;
  'N° contrat ADEME'?: string;
  'Autres réseaux'?: string;
  'Export zones à fort potentiel sans RCU pour des villes de 5 000 à 25 000 habitants (source : EnRezo, établi par FCU)': string;
  'Commentaires / précision de la date'?: string;
  'Date de dernière actualisation'?: string;
  'Auteur '?: string;
  'Code postal': number;
}

export interface PreformattedEtudeEnCours {
  maitre_ouvrage: string;
  code_insee: number;
  status: string;
  launched_at: Date;
}

const logger = parentLogger.child({
  name: 'etudes-en-cours',
});

export default class EtudesEnCoursAdapter extends BaseAdapter {
  /**
   *
   * @param filepath must be like in "data/etudes-en-cours-sample.csv", initially taken from a Google Doc named "Extraction de DATA Cartographie - pour FCU_02122024"
   * https://docs.google.com/spreadsheets/d/11MJDXja4Od1tmYUM7a4d2EqiaGjlQiUM/edit?gid=1515069000#gid=1515069000
   */
  async importData(filepath?: string) {
    if (!filepath) {
      throw new Error('Vous devez fournir un fichier CSV');
    }
    const data: CSVEtudeEnCours[] = await loadDataFromFile(filepath);

    const etudesEnCours = data.reduce(
      (acc, row) => {
        if (row['Ne Pas Afficher'] === 'X') {
          logger.info(`💤 Skipping ${row.EtudeId}`, { row });
          return acc;
        }
        if (!acc[row.EtudeId]) {
          acc[row.EtudeId] = [];
        }
        const statusString = row['Etude en cours / étude réalisée (pour FCU)'];
        const status = statusString === 'Etude en cours' ? 'ongoing' : statusString === 'Etude réalisée' ? 'done' : null;
        if (!status) {
          logger.error('⚠️ status not found', { row });
          return acc;
        }

        const launchedAt = row['Date lancement du projet / étude pour FCU (mois / année)'];
        if (!launchedAt) {
          logger.error('⚠️ launchedAt not found', { row });
          return acc;
        }
        const [day, month, year] = launchedAt?.split('/') || [];
        const formattedDate = new Date(`${month}/${day}/${year} 12:00:00`); // Use 12 in order to bypass timezone problems as command is launched on local

        logger.info(`🚀 Handling ${row.EtudeId}`, { row });
        acc[row.EtudeId].push({
          maitre_ouvrage: row["Maître d'ouvrage  "] || '',
          code_insee: row['Code INSEE'],
          status,
          launched_at: formattedDate,
        });
        return acc;
      },
      {} as { [key: number]: PreformattedEtudeEnCours[] }
    );

    const entries = Object.entries(etudesEnCours);

    logger.info('Deleting old collection');
    await kdb.deleteFrom('etudes_en_cours').execute();

    await Promise.all(
      entries.map(async (entry, index) => {
        const [etudeId, communes] = entry;
        const maitres_ouvrage = [...new Set(communes.map(({ maitre_ouvrage }) => maitre_ouvrage))].join(', ');
        const commune_ids = communes.map(({ code_insee }) => `${code_insee}`);

        const launched_at = communes.reduce(
          (acc, commune) => {
            if (acc && acc.toISOString() !== commune.launched_at.toISOString()) {
              logger.error(entry);
              logger.error(`L’étude ${etudeId} a plusieurs dates de lancement ${commune.launched_at.toISOString()} ${acc.toISOString()}`);
            }
            return commune.launched_at;
          },
          undefined as Date | undefined
        );
        const status = communes.reduce(
          (acc, commune) => {
            if (acc && acc !== commune.status) {
              logger.error(entry);
              logger.error(`L’étude ${etudeId} a plusieurs status`);
            }
            return commune.status;
          },
          undefined as string | undefined
        );
        logger.info(`${index}/${entries.length} Inserting ${etudeId}`);

        if (commune_ids.length === 0) {
          logger.error(`⚠️ No commune ids found for ${etudeId}`);
          logger.error(entry);
          return;
        }

        const communeNames = await kdb
          .selectFrom('ign_communes')
          .select(sql`nom`.as('nom'))
          .where('insee_com', 'in', commune_ids)
          .execute();

        const result = await kdb
          .selectFrom('ign_communes')
          .select([sql`ST_AsGeoJSON(ST_Union(geom))`.as('geom')])
          .where('insee_com', 'in', commune_ids)
          .executeTakeFirst();

        try {
          await kdb
            .insertInto('etudes_en_cours')
            .values({
              id: +etudeId,
              maitre_ouvrage: maitres_ouvrage,
              status: status || '',
              geom: result?.geom as string,
              commune_ids,
              communes: communeNames.map(({ nom }) => nom).join(', '),
              launched_at: launched_at ? launched_at.toISOString() : '',
            })
            .execute();
          logger.info(`✅ Inserted successfully ${etudeId}`);
        } catch (err) {
          logger.error(`Could not insert ${etudeId}`, { err });
        }
      })
    );
  }
}
