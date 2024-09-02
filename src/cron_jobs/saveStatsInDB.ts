import * as Sentry from '@sentry/node';

import db from 'src/db';
import base from 'src/db/airtable';
import { bulkFetchRangeFromMatomo } from 'src/services/matomo';
import { MatomoActionMetrics, MatomoPageMetrics, MatomoUniqueVisitorsMetrics } from 'src/services/matomo_types';
import { Airtable } from 'src/types/enum/Airtable';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PARAMS, STAT_PERIOD } from 'src/types/enum/MatomoStats';

const DATA_ACTION_STATS: string[] = [
  STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE,
  STAT_LABEL.FORM_TEST_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_ELIGIBLE,
  STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE,
  STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE,
  STAT_LABEL.TRACES,
];

const saveDataCountContactStats = async (startDate: string, endDate: string) => {
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
  await db('matomo_stats').insert({
    method: STAT_METHOD.AIRTABLE,
    stat_key: STAT_KEY.NB_CONTACTS,
    date: startDate,
    period: STAT_PERIOD.MONTHLY,
    value: monthValue.nbEligible,
    stat_label: STAT_LABEL.NB_ELIGIBLE,
  });
  await db('matomo_stats').insert({
    method: STAT_METHOD.AIRTABLE,
    stat_key: STAT_KEY.NB_CONTACTS,
    date: startDate,
    period: STAT_PERIOD.MONTHLY,
    value: monthValue.nbUneligible,
    stat_label: STAT_LABEL.NB_UNELIGIBLE,
  });
  await db('matomo_stats').insert({
    method: STAT_METHOD.AIRTABLE,
    stat_key: STAT_KEY.NB_CONTACTS,
    date: startDate,
    period: STAT_PERIOD.MONTHLY,
    value: monthValue.nbTotal,
    stat_label: STAT_LABEL.NB_TOTAL,
  });
};

const saveDataActionsStats = async (startDate: string, endDate: string) => {
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
    await DATA_ACTION_STATS.forEach(async (action: any) => {
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
    });
  }
};

const saveDataVisitsStats = async (startDate: string, endDate: string) => {
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
};

const saveDataVisitsMapStats = async (startDate: string, endDate: string) => {
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
      await db('matomo_stats').insert({
        method: STAT_METHOD.MAP_VISIT_SUMMARY,
        method_params: STAT_PARAMS.URL,
        stat_key: STAT_KEY.NB_VISITS,
        date: startDate,
        period: STAT_PERIOD.MONTHLY,
        value: data.value,
      });
    }
  }
};

const saveDataCountBulkContactStats = async (startDate: string, endDate: string) => {
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
    await db('matomo_stats').insert({
      method: STAT_METHOD.DATABASE,
      stat_key: STAT_KEY.BULK_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbEligible,
      stat_label: STAT_LABEL.NB_ELIGIBLE,
    });
    await db('matomo_stats').insert({
      method: STAT_METHOD.DATABASE,
      stat_key: STAT_KEY.BULK_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbUneligible,
      stat_label: STAT_LABEL.NB_UNELIGIBLE,
    });
    await db('matomo_stats').insert({
      method: STAT_METHOD.DATABASE,
      stat_key: STAT_KEY.BULK_CONTACTS,
      date: startDate,
      period: STAT_PERIOD.MONTHLY,
      value: monthValue.nbTotal,
      stat_label: STAT_LABEL.NB_TOTAL,
    });
  }
};

export const saveDataStats = async () => {
  console.log(`CRON JOB START: saveDataStats`);
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    const stringStartDate = startDate.toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setDate(0);
    const stringEndDate = endDate.toISOString().slice(0, 10);

    const endAirtableDate = new Date();
    endAirtableDate.setDate(1);
    const stringEndAirtableDate = endAirtableDate.toISOString().slice(0, 10);

    await saveDataCountContactStats(stringStartDate, stringEndAirtableDate);
    await saveDataActionsStats(stringStartDate, stringEndDate);
    await saveDataVisitsStats(stringStartDate, stringEndDate);
    await saveDataVisitsMapStats(stringStartDate, stringEndDate);
    await saveDataCountBulkContactStats(stringStartDate, stringEndDate);
  } catch (e) {
    Sentry.captureException(e);
    console.log(`CRON JOB ERROR: saveDataStats`, e);
  }
  console.log('CRON JOB STOP: saveDataStats');
};
