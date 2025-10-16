import { type DonneesDeConsos, kdb, sql } from '@/server/db/kysely';
import { processInParallel } from '@/types/async';
import { chunk } from '@/utils/array';
import { isDefined } from '@/utils/core';
import { fetchJSON } from '@/utils/network';
import { defineImportFunc } from '../import';

type DonneesConsoGazBrutes = {
  OPERATEUR: string;
  CODE_EIC: string;
  FILIERE: string;
  CODE_GRAND_SECTEUR: string;
  CONSO: number;
  PDL: number;
  NOM_COMMUNE: string;
  ADRESSE: string;
  ALERTE_CONSO_IRIS: any;
  BAN_LATITUDE: number | null;
  BAN_LONGITUDE: number | null;
  BAN_ADRESSE: string | null;
  BAN_QUALITE: number | null;
  BAN_NIVEAU: string | null;
  BAN_ID: string | null;
  ANNEE: string;
  CODE_IRIS_CODE: string;
  CODE_IRIS_LIBELLE: string;
  CODE_SECTEUR_NAF2_CODE: string;
  CODE_SECTEUR_NAF2_LIBELLE: string;
};

export const importConsommationsGaz = defineImportFunc(async ({ logger }) => {
  logger.info("🚀 Début de l'import des consommations de gaz");

  // Téléchargement des données depuis l'API SDES
  const consommations = await fetchJSON<DonneesConsoGazBrutes[]>(
    'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/f68dee12-435f-40c8-bb4a-b869c598b046/json?millesime=2024-09'
  );

  logger.info(`📊 ${consommations.length} consommations de gaz téléchargées`);

  const consommationsAvecAdresse = consommations
    .filter((consommation) => consommation.BAN_ADRESSE && isDefined(consommation.BAN_LATITUDE) && isDefined(consommation.BAN_LONGITUDE))
    .map((consommation) => {
      return {
        adresse: consommation.BAN_ADRESSE!,
        code_grand: consommation.CODE_GRAND_SECTEUR as DonneesDeConsos['code_grand'],
        conso_nb: consommation.CONSO,
        geom: sql.raw<string>(
          `ST_Transform(ST_GeomFromEWKT('SRID=4326;POINT(${consommation.BAN_LONGITUDE} ${consommation.BAN_LATITUDE})'), 2154)`
        ) as any,
        pdl_nb: consommation.PDL,
      } satisfies DonneesDeConsos;
    });

  const batches = chunk(consommationsAvecAdresse, 100);

  await kdb.transaction().execute(async (trx) => {
    logger.info('🧹 Suppression des anciennes consommations de gaz');
    await trx.deleteFrom('donnees_de_consos').execute();

    await processInParallel(batches, 10, async (batch) => {
      await trx.insertInto('donnees_de_consos').values(batch).execute();
    });
  });
  // Vérification finale
  const totalCount = await kdb.selectFrom('donnees_de_consos').select(sql<number>`count(*)`.as('count')).executeTakeFirst();
  logger.info(`🎉 Import terminé avec succès! Total: ${totalCount?.count} enregistrements`);
});
