import * as Sentry from '@sentry/node';

import base from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { bulkFetchRangeFromMatomo } from '@/server/services/matomo';
import { type MatomoActionMetrics, type MatomoPageMetrics, type MatomoUniqueVisitorsMetrics } from '@/server/services/matomo_types';
import { Airtable } from '@/types/enum/Airtable';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PARAMS, STAT_PERIOD } from '@/types/enum/MatomoStats';
import '@root/sentry.node.config';
import { USER_ROLE } from '@/types/enum/UserRole';

const DATA_ACTION_STATS: string[] = [
  STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE,
  STAT_LABEL.FORM_TEST_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_ELIGIBLE,
  STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE,
  STAT_LABEL.FORM_TEST_COMPARATEUR_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE,
  STAT_LABEL.TRACES,
];

const addStat =
  (method: string) =>
  async ({
    value,
    period = STAT_PERIOD.MONTHLY,
    stat_key,
    date,
    stat_label,
    method_params,
  }: {
    value: number;
    stat_key: string;
    date: string | Date;
    period?: string;
    stat_label?: string; // deprecated
    method_params?: string;
  }) => {
    // Optional: Check existing value before insert to detect conflicts precisely
    let query = kdb
      .selectFrom('matomo_stats')
      .selectAll()
      .where('method', '=', method)
      .where('stat_key', '=', stat_key)
      .where(kdb.fn('DATE', ['date']), '=', date)
      .where('period', '=', period);
    if (stat_label) {
      query = query.where('stat_label', '=', stat_label);
    }

    const existing = await query.executeTakeFirst();

    const message = `${stat_key} - ${date} - ${period} - ${method} - ${stat_label || 'No label'}`;
    if (existing) {
      if (existing.value !== value) {
        console.log(`⚠️ Conflict detected: ${existing.value}≠${value} for ${message}`);
      } else {
        console.log(`💤 No change for ${message}`);
      }

      return existing;
    }

    const result = await kdb
      .insertInto('matomo_stats')
      .values({
        value,
        period,
        stat_key,
        stat_label,
        date,
        method,
        method_params,
      })
      .onConflict(
        (oc) =>
          oc
            .columns(['method', 'stat_key', 'date', 'period', 'stat_label']) // Unique constraint columns
            .doNothing() // do not update as some values are replaced manually in the database
        // .doUpdateSet({
        //   value, // Update value if conflict occurs
        // })
      )
      .returning([sql<number>`"value"::integer`.as('value'), 'stat_key', 'stat_label', 'date', 'period', 'method'])
      .execute();
    console.log(`✅ Inserted ${stat_key} - ${stat_label} - ${date} - ${period} - ${method}`);

    return result;
  };

const addStatFromDB = addStat(STAT_METHOD.DATABASE);
const addStatFromAirtable = addStat(STAT_METHOD.AIRTABLE);
const addStatFromActions = addStat(STAT_METHOD.ACTIONS);
const addStatFromVisitsSummary = addStat(STAT_METHOD.VISIT_SUMMARY);
const addStatFromMapVisitSummary = addStat(STAT_METHOD.MAP_VISIT_SUMMARY);

const saveDemandsStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveDemandsStats`);
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `AND(
          IS_BEFORE({Date de la demande}, "${endDate}"),
          IS_AFTER({Date de la demande}, "${startDate}")
        )`,
    })
    .all();

  const monthValue = {
    nbTotal: 0,
    nbEligible: 0,
    nbUneligible: 0,
  };
  records.map((record: any) => {
    monthValue.nbTotal++;
    if (record.fields['Éligibilité'] && (!record.fields['Distance au réseau'] || record.fields['Distance au réseau'] <= 100)) {
      monthValue.nbEligible++;
    } else {
      monthValue.nbUneligible++;
    }
  });
  await Promise.all([
    addStatFromAirtable({
      stat_key: STAT_KEY.NB_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbEligible,
      stat_label: STAT_LABEL.NB_ELIGIBLE,
    }),
    addStatFromAirtable({
      stat_key: STAT_KEY.NB_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbUneligible,
      stat_label: STAT_LABEL.NB_UNELIGIBLE,
    }),
    addStatFromAirtable({
      stat_key: STAT_KEY.NB_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbTotal,
      stat_label: STAT_LABEL.NB_TOTAL,
    }),
  ]);
  console.log(`saveStatsInDB END : saveDemandsStats`);
};

//From Matomo - actions sur le site
const saveActionsStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveActionsStats`);
  const results = await bulkFetchRangeFromMatomo<MatomoActionMetrics>(
    {
      method: 'Events.getAction',
      period: 'range',
      date: startDate + ',' + endDate,
    },
    (entry) => ({ [entry.label]: entry.nb_events })
  );
  if (results[0]) {
    const data: any = results[0];
    await Promise.all(
      DATA_ACTION_STATS.map(async (action: any) => {
        if (data[action]) {
          addStatFromActions({
            stat_key: STAT_KEY.NB_EVENTS,
            date: startDate,
            period: STAT_PERIOD.MONTHLY,
            value: +data[action],
            stat_label: action,
          });
        }
      })
    );
  }
  console.log(`saveStatsInDB END : saveActionsStats`);
};

//From Matomo - visites sur le site
const saveVisitsStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveVisitsStats`);
  const results = await bulkFetchRangeFromMatomo<MatomoUniqueVisitorsMetrics>({
    method: 'VisitsSummary.getUniqueVisitors',
    period: 'range',
    date: startDate + ',' + endDate,
  });
  if (results[0].value) {
    await addStatFromVisitsSummary({
      stat_key: STAT_KEY.NB_UNIQ_VISITORS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: results[0].value,
    });
  }
  console.log(`saveStatsInDB END : saveVisitsStats`);
};

//From Matomo - visites sur la page de la carte (/carte)
const saveVisitsMapStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveVisitsMapStats`);
  const results = await bulkFetchRangeFromMatomo<MatomoPageMetrics>(
    {
      method: 'Actions.getPageUrl',
      pageUrl: '/carte',
      period: 'range',
      date: startDate + ',' + endDate,
    },
    (entry) => ({ value: entry.nb_visits })
  );
  if (results[0]) {
    const data: any = results[0];
    if (data.value) {
      await addStatFromMapVisitSummary({
        method_params: STAT_PARAMS.URL,
        stat_key: STAT_KEY.NB_VISITS,
        date: startDate,
        period: STAT_PERIOD.MONTHLY,
        value: data.value,
      });
    }
  }
  console.log(`saveStatsInDB END : saveVisitsMapStats`);
};

//From Database - demandes en masse : éligibles / non éligibles / totales
const saveBulkContactStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveBulkContactStats`);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59);
  const [legacyEligibilityTestsStats, proEligibilityTestsStats] = await Promise.all([
    kdb
      .selectFrom('eligibility_tests')
      .select([
        sql<number>`sum(COALESCE(addresses_count, 0) - COALESCE(error_count, 0))`.as('total'),
        sql<number>`sum(COALESCE(eligibile_count, 0))`.as('nbEligible'),
      ])
      .where('in_error', 'is', null)
      .where('created_at', '>=', start)
      .where('created_at', '<=', end)
      .executeTakeFirst(),
    kdb
      .selectFrom('pro_eligibility_tests')
      .leftJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests.id', 'pro_eligibility_tests_addresses.test_id')
      .select([
        sql<number>`count(pro_eligibility_tests_addresses.id)`.as('total'),
        sql<number>`count(case when eligibility_status->'isEligible' = 'true' then 1 end)`.as('nbEligible'),
      ])
      .where('ban_valid', 'is', true)
      .where('pro_eligibility_tests.created_at', '>=', start)
      .where('pro_eligibility_tests.created_at', '<=', end)
      .executeTakeFirst(),
  ]);

  const monthValue = {
    nbTotal: (legacyEligibilityTestsStats?.total ?? 0) + (proEligibilityTestsStats?.total ?? 0),
    nbEligible: (legacyEligibilityTestsStats?.nbEligible ?? 0) + (proEligibilityTestsStats?.nbEligible ?? 0),
    nbUneligible: 0,
  };
  monthValue.nbUneligible = monthValue.nbTotal - monthValue.nbEligible;

  await Promise.all([
    addStatFromDB({
      stat_key: STAT_KEY.BULK_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbEligible,
      stat_label: STAT_LABEL.NB_ELIGIBLE,
    }),
    addStatFromDB({
      stat_key: STAT_KEY.BULK_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbUneligible,
      stat_label: STAT_LABEL.NB_UNELIGIBLE,
    }),
    addStatFromDB({
      stat_key: STAT_KEY.BULK_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbTotal,
      stat_label: STAT_LABEL.NB_TOTAL,
    }),
  ]);
  console.log(`saveStatsInDB END : saveBulkContactStats`);
};

const saveComptesProCreatedStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveComptesProCreatedStats`);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59);
  const comptesProCreated = await kdb
    .selectFrom('users')
    .select([
      sql<string>`TO_CHAR(date_trunc('day', created_at), 'yyyy-mm-dd')`.as('date'),
      sql<number>`COUNT(CASE WHEN role = ${USER_ROLE.PROFESSIONNEL} THEN 1 END)`.as('professionnels'),
      sql<number>`COUNT(CASE WHEN role = ${USER_ROLE.PARTICULIER} THEN 1 END)`.as('particuliers'),
    ])
    .where('created_at', '>=', start)
    .where('created_at', '<=', end)
    .groupBy(sql`date_trunc('day', created_at)`)
    .orderBy('date', 'asc')
    .execute();

  // Check if we have any data to process
  if (comptesProCreated.length === 0) {
    console.log('No accounts created in the specified period');
    return;
  }

  const statsPromises = comptesProCreated.flatMap((monthData) => {
    console.log(
      `Processing accounts created for ${monthData.date}: ${monthData.professionnels} pro, ${monthData.particuliers} particuliers`
    );

    return [
      addStatFromDB({
        stat_key: STAT_KEY.NB_ACCOUNTS_PRO_CREATED,
        date: monthData.date,
        value: monthData.professionnels,
      }),
      addStatFromDB({
        stat_key: STAT_KEY.NB_ACCOUNTS_PARTICULIER_CREATED,
        date: monthData.date,
        value: monthData.particuliers,
      }),
    ];
  });

  await Promise.all(statsPromises);

  console.log(`saveStatsInDB END : saveComptesProCreatedStats`);
};

export const saveStatsInDB = async (start?: string, end?: string) => {
  console.log(`CRON JOB START: saveStatsInDB`);
  try {
    const startDate = start ? new Date(start) : new Date();
    if (!start) {
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
    }
    const stringStartDate = startDate.toISOString().slice(0, 10);
    const endDate = end ? new Date(end) : new Date();
    if (!end) {
      endDate.setDate(0);
    }
    const stringEndDate = endDate.toISOString().slice(0, 10);
    console.log(`From ${stringStartDate} to ${stringEndDate}`);

    const endAirtableDate = endDate;
    endAirtableDate.setDate(endAirtableDate.getDate() + 1);
    const stringEndAirtableDate = endAirtableDate.toISOString().slice(0, 10);

    await Promise.all([
      saveDemandsStats(stringStartDate, stringEndAirtableDate),
      saveActionsStats(stringStartDate, stringEndDate),
      saveVisitsStats(stringStartDate, stringEndDate),
      saveVisitsMapStats(stringStartDate, stringEndDate),
      saveBulkContactStats(stringStartDate, stringEndDate),
      saveComptesProCreatedStats(stringStartDate, stringEndDate),
    ]);
  } catch (e) {
    Sentry.captureException(e);
    console.log(`CRON JOB ERROR: saveStatsInDB`, e);
  }
  console.log('CRON JOB STOP: saveStatsInDB');
};
