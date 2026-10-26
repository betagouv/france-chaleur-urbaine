import { parentLogger } from '@/server/helpers/logger';
import { dayjs } from '@/utils/date';

import { notifyCcrtOfUnhandledDemandesChaleurRenouvelable } from './service';

const CCRT_UNHANDLED_DEMAND_REMINDER_CRON = 'notifyCcrtOfUnhandledDemandesChaleurRenouvelable';
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const BIWEEKLY_REMINDER_INTERVAL_DAYS = 14;
// Generic Monday reference; ISO week parity breaks on 53-week years.
const UNIX_EPOCH_FIRST_MONDAY_UTC_DAY = Date.UTC(1970, 0, 5) / DAY_IN_MILLISECONDS;

const logger = parentLogger.child({ module: 'chaleur-renouvelable' });

/** Keeps the scheduled CCRT reminder on a continuous 14-day cadence. */
export function shouldSendCcrtUnhandledDemandReminder(runDate = dayjs().tz('Europe/Paris')): boolean {
  const parisRunDay = runDate.tz('Europe/Paris').startOf('day');
  const parisRunDayUtcDay = Date.UTC(parisRunDay.year(), parisRunDay.month(), parisRunDay.date()) / DAY_IN_MILLISECONDS;
  const daysSinceReferenceMonday = parisRunDayUtcDay - UNIX_EPOCH_FIRST_MONDAY_UTC_DAY;

  return daysSinceReferenceMonday % BIWEEKLY_REMINDER_INTERVAL_DAYS === 0;
}

/** Runs the weekly CCRT reminder cron only on the biweekly cadence. */
export async function runScheduledCcrtUnhandledDemandReminder() {
  const runDate = dayjs().tz('Europe/Paris');

  if (!shouldSendCcrtUnhandledDemandReminder(runDate)) {
    logger.info('cron skipped outside biweekly cadence', { cron: CCRT_UNHANDLED_DEMAND_REMINDER_CRON });
    return;
  }

  await notifyCcrtOfUnhandledDemandesChaleurRenouvelable(runDate);
}
