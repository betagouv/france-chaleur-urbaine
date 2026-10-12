import { describe, expect, it } from 'vitest';

import { dayjs } from '@/utils/date';

import { shouldSendCcrtUnhandledDemandReminder } from './ccrt-reminders';

describe('shouldSendCcrtUnhandledDemandReminder', () => {
  it('autorise la relance CCRT une semaine sur deux', () => {
    expect(shouldSendCcrtUnhandledDemandReminder(dayjs.tz('2026-10-12 09:45', 'Europe/Paris'))).toBe(true);
    expect(shouldSendCcrtUnhandledDemandReminder(dayjs.tz('2026-10-19 09:45', 'Europe/Paris'))).toBe(false);
    expect(shouldSendCcrtUnhandledDemandReminder(dayjs.tz('2026-10-26 09:45', 'Europe/Paris'))).toBe(true);
  });

  it('conserve une cadence continue autour des années à 53 semaines ISO', () => {
    expect(shouldSendCcrtUnhandledDemandReminder(dayjs.tz('2020-12-28 09:45', 'Europe/Paris'))).toBe(true);
    expect(shouldSendCcrtUnhandledDemandReminder(dayjs.tz('2021-01-04 09:45', 'Europe/Paris'))).toBe(false);
    expect(shouldSendCcrtUnhandledDemandReminder(dayjs.tz('2021-01-11 09:45', 'Europe/Paris'))).toBe(true);
  });
});
