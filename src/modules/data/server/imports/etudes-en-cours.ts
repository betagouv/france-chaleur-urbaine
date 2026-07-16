import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';

import { defineImportFunc } from '../import';

// Source (read-only) https://grist.numerique.gouv.fr/o/fcu/g2f9JTfpSUSu/Communes-couvertes-par-une-etude

const gristEtudesEnCoursRecordsURL =
  'https://grist.numerique.gouv.fr/api/docs/g2f9JTfpSUSu/tables/Listes_des_etudes_de_creation_de_RC/records';

type GristEtudeEnCoursRecord = {
  id: number;
  fields: {
    Etude_ID: number;
    Codes_INSEE: string | null;
    Commune_s_: string;
    Maitre_d_ouvrage: string;
    Statut: string;
    Region: string;
    Date_de_debut_lancement: number | null; // unix timestamp in seconds
    Date_de_mise_a_jour_de_la_donnee: number | null;
  };
};

const inseeCodeRegex = /^(\d{2}|2[AB])\d{3}$/;

const zEtudeEnCours = z
  .object({
    Codes_INSEE: z
      .string()
      .transform((codes) =>
        codes
          .split(',')
          .map((code) => code.trim())
          .filter(Boolean)
      )
      .pipe(z.array(z.string().regex(inseeCodeRegex, 'invalid INSEE code')).min(1)),
    Date_de_debut_lancement: z.number().transform((timestamp) => new Date(timestamp * 1000)),
    Etude_ID: z.number(),
    Maitre_d_ouvrage: z.string(),
  })
  .transform((fields) => ({
    codesInsee: fields.Codes_INSEE,
    id: fields.Etude_ID,
    launchedAt: fields.Date_de_debut_lancement,
    maitreOuvrage: fields.Maitre_d_ouvrage,
  }));

// Fonction d'import pour les études en cours, depuis le Grist FCU "Communes couvertes par une étude"
export const importEtudesEnCours = defineImportFunc(async ({ logger }) => {
  const { records } = await fetchJSON<{ records: GristEtudeEnCoursRecord[] }>(gristEtudesEnCoursRecordsURL);

  const isEmptyRecord = (record: GristEtudeEnCoursRecord) => !record.fields.Codes_INSEE?.trim();
  const emptyRecordsCount = records.filter(isEmptyRecord).length;
  if (emptyRecordsCount > 0) {
    logger.info(`💤 Skipping ${emptyRecordsCount} empty rows`);
  }

  const parsedRecords = records
    .filter((record) => !isEmptyRecord(record))
    .map((record) => ({ parseResult: zEtudeEnCours.safeParse(record.fields), record }));

  parsedRecords.forEach((parsedRecord) => {
    if (!parsedRecord.parseResult.success) {
      const issues = parsedRecord.parseResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      logger.error(`⚠️ Invalid Etude_ID ${parsedRecord.record.fields.Etude_ID} (${issues}), fix it in Grist`);
    }
  });

  const etudes = parsedRecords.flatMap((parsedRecord) => (parsedRecord.parseResult.success ? [parsedRecord.parseResult.data] : []));

  const duplicateEtudes = etudes.filter((etude, index) => etudes.findIndex((other) => other.id === etude.id) !== index);
  duplicateEtudes.forEach((etude) => logger.error(`⚠️ Duplicate Etude_ID ${etude.id}, fix it in Grist`));

  const uniqueEtudes = etudes.filter((etude) => !duplicateEtudes.includes(etude));

  logger.info(`Importing ${uniqueEtudes.length}/${records.length} études`);

  await kdb.deleteFrom('etudes_en_cours').execute();

  const insertions = await Promise.all(
    uniqueEtudes.map(async (etude) => {
      const communes = await kdb
        .selectFrom('ign_communes')
        .select([sql<string[]>`array_agg(nom order by nom)`.as('noms'), sql<string>`ST_AsGeoJSON(ST_Union(geom))`.as('geom')])
        .where('insee_com', 'in', etude.codesInsee)
        .executeTakeFirst();

      if (!communes?.geom) {
        logger.error(`⚠️ No commune found for Etude_ID ${etude.id}, fix the INSEE codes in Grist`);
        return false;
      }
      if (communes.noms.length !== etude.codesInsee.length) {
        logger.error(`⚠️ Some INSEE codes of Etude_ID ${etude.id} do not match a commune, fix them in Grist`);
      }

      try {
        await kdb
          .insertInto('etudes_en_cours')
          .values({
            commune_ids: etude.codesInsee,
            communes: communes.noms.join(', '),
            geom: communes.geom,
            id: etude.id,
            launched_at: etude.launchedAt.toISOString(),
            maitre_ouvrage: etude.maitreOuvrage,
          })
          .execute();
        return true;
      } catch (err) {
        logger.error(`Could not insert ${etude.id}`, { err });
        return false;
      }
    })
  );

  logger.info(`✅ Inserted ${insertions.filter(Boolean).length}/${uniqueEtudes.length} études`);
});
