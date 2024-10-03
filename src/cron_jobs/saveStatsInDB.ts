//import * as Sentry from '@sentry/node';

//import db from 'src/db';
//import base from 'src/db/airtable';
import { bulkFetchRangeFromMatomo } from 'src/services/matomo';
import { /*MatomoActionMetrics,*/ MatomoPageMetrics /*, MatomoUniqueVisitorsMetrics*/ } from 'src/services/matomo_types';
//import { Airtable } from 'src/types/enum/Airtable';
//import { STAT_KEY, /*STAT_LABEL, */ STAT_METHOD, STAT_PARAMS, STAT_PERIOD } from 'src/types/enum/MatomoStats';

import '../../sentry.node.config';

/*const DATA_ACTION_STATS: string[] = [
  STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE,
  STAT_LABEL.FORM_TEST_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_ELIGIBLE,
  STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE,
  STAT_LABEL.TRACES,
];*/

//From Airtable - demandes : éligibles / non éligibles / totales
/*const saveDemandsStats = async (startDate: string, endDate: string) => {
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
    db('matomo_stats').insert({
      method: STAT_METHOD.AIRTABLE,
      stat_key: STAT_KEY.NB_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbEligible,
      stat_label: STAT_LABEL.NB_ELIGIBLE,
    }),
    db('matomo_stats').insert({
      method: STAT_METHOD.AIRTABLE,
      stat_key: STAT_KEY.NB_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbUneligible,
      stat_label: STAT_LABEL.NB_UNELIGIBLE,
    }),
    db('matomo_stats').insert({
      method: STAT_METHOD.AIRTABLE,
      stat_key: STAT_KEY.NB_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbTotal,
      stat_label: STAT_LABEL.NB_TOTAL,
    }),
  ]);
  console.log(`saveStatsInDB END : saveDemandsStats`);
};*/

//From Matomo - actions sur le site
/*const saveActionsStats = async (startDate: string, endDate: string) => {
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
          await db('matomo_stats').insert({
            method: STAT_METHOD.ACTIONS,
            stat_key: STAT_KEY.NB_EVENTS,
            date: startDate,
            period: STAT_PERIOD.MONTHLY,
            value: data[action],
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
    await db('matomo_stats').insert({
      method: STAT_METHOD.VISIT_SUMMARY,
      stat_key: STAT_KEY.NB_UNIQ_VISITORS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: results[0].value,
    });
  }
  console.log(`saveStatsInDB END : saveVisitsStats`);
};*/

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
  console.log(results);
  /*if (results[0]) {
    const data: any = results[0];
    if (data.value) {
      await db('matomo_stats').insert({
        method: STAT_METHOD.MAP_VISIT_SUMMARY,
        method_params: STAT_PARAMS.URL,
        stat_key: STAT_KEY.NB_VISITS,
        date: startDate,
        period: STAT_PERIOD.MONTHLY,
        value: data.value,
      });
    }
  }*/
  console.log(`saveStatsInDB END : saveVisitsMapStats`);
};

//From Database - demandes en masse : éligibles / non éligibles / totales
/*const saveBulkContactStats = async (startDate: string, endDate: string) => {
  console.log(`saveStatsInDB START : saveBulkContactStats`);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59);
  const results = await db('eligibility_tests')
    .select()
    .whereNull('in_error')
    .andWhereBetween('created_at', [start, end])
    .orderBy('created_at', 'asc');

  if (results[0]) {
    const monthValue = {
      nbTotal: 0,
      nbEligible: 0,
      nbUneligible: 0,
    };
    results.map((value: any) => {
      monthValue.nbTotal += value.addresses_count - value.error_count;
      monthValue.nbEligible += value.eligibile_count;
      monthValue.nbUneligible = monthValue.nbTotal - monthValue.nbEligible;
    });
    await Promise.all([
      db('matomo_stats').insert({
        method: STAT_METHOD.DATABASE,
        stat_key: STAT_KEY.BULK_CONTACTS,
        date: startDate,
        period: STAT_PERIOD.MONTHLY,
        value: monthValue.nbEligible,
        stat_label: STAT_LABEL.NB_ELIGIBLE,
      }),
      db('matomo_stats').insert({
        method: STAT_METHOD.DATABASE,
        stat_key: STAT_KEY.BULK_CONTACTS,
        date: startDate,
        period: STAT_PERIOD.MONTHLY,
        value: monthValue.nbUneligible,
        stat_label: STAT_LABEL.NB_UNELIGIBLE,
      }),
      db('matomo_stats').insert({
        method: STAT_METHOD.DATABASE,
        stat_key: STAT_KEY.BULK_CONTACTS,
        date: startDate,
        period: STAT_PERIOD.MONTHLY,
        value: monthValue.nbTotal,
        stat_label: STAT_LABEL.NB_TOTAL,
      }),
    ]);
  }
  console.log(`saveStatsInDB END : saveBulkContactStats`);
};*/

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

    const endAirtableDate = endDate;
    endAirtableDate.setDate(endAirtableDate.getDate() + 1);
    //const stringEndAirtableDate = endAirtableDate.toISOString().slice(0, 10);

    //await saveDemandsStats(stringStartDate, stringEndAirtableDate);
    //await saveActionsStats(stringStartDate, stringEndDate);
    //await saveVisitsStats(stringStartDate, stringEndDate);
    await saveVisitsMapStats(stringStartDate, stringEndDate);
    //await saveBulkContactStats(stringStartDate, stringEndDate);
  } catch (e) {
    //Sentry.captureException(e);
    console.log(`CRON JOB ERROR: saveStatsInDB`, e);
  }
  console.log('CRON JOB STOP: saveStatsInDB');
};
