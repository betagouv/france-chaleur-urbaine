import { describe, expect, it } from 'vitest';

import { demandeChaleurRenouvelableStatuses } from '@/modules/chaleur-renouvelable/constants';
import { demandStatuses } from '@/modules/demands/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { accompagnementStatusDisplays, raccordementStatusDisplays } from '../constants';
import { sortDemandsForEmail } from './service';

const demand = (phase: 'en_cours' | 'cloturee', createdAt: string) => ({
  createdAt: new Date(createdAt),
  status: { explanation: '', label: phase, phase },
});

describe('sortDemandsForEmail', () => {
  it('lists open demands first, then closed ones, most recent first within each group', () => {
    const closedOld = demand('cloturee', '2026-01-01');
    const closedRecent = demand('cloturee', '2026-06-01');
    const openOld = demand('en_cours', '2026-02-01');
    const openRecent = demand('en_cours', '2026-05-01');

    expect(sortDemandsForEmail([closedOld, openOld, closedRecent, openRecent])).toStrictEqual([
      openRecent,
      openOld,
      closedRecent,
      closedOld,
    ]);
  });

  it('returns an empty list unchanged', () => {
    expect(sortDemandsForEmail([])).toStrictEqual([]);
  });
});

describe('status wording tables', () => {
  it.each(demandStatuses.map((status) => status.label))(
    'raccordement status "%s" has a public label distinct from the internal one',
    (status) => {
      const display = raccordementStatusDisplays[status];
      expect(display.label).not.toStrictEqual(status);
      expect(display.explanation.length).toBeGreaterThan(0);
    }
  );

  it.each(demandeChaleurRenouvelableStatuses.map((status) => status.label))('accompagnement status "%s" has a public wording', (status) => {
    const display = accompagnementStatusDisplays[status];
    expect(display.label.length).toBeGreaterThan(0);
    expect(display.explanation.length).toBeGreaterThan(0);
  });

  it('closes the terminal raccordement statuses only', () => {
    const closedStatuses = demandStatuses
      .map((status) => status.label)
      .filter((status) => raccordementStatusDisplays[status].phase === 'cloturee');
    expect(closedStatuses).toStrictEqual([DEMANDE_STATUS.UNREALISABLE, DEMANDE_STATUS.DONE, DEMANDE_STATUS.ABANDONNED]);
  });
});
