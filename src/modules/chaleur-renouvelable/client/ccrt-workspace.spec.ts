import { describe, expect, it } from 'vitest';

import { uuid } from '@/tests/helpers';

import { formatCcrtAddress, getCcrtAccessWarning, getCcrtDemandTab, matchesCcrtAdminTab, matchesCcrtDemandSearch } from './ccrt-workspace';

describe('formatCcrtAddress', () => {
  it.each([
    ['15 Rue des Fleurs 44300 Nantes', '15 Rue des Fleurs, 44300 Nantes'],
    ['15 Rue des Fleurs, 44300 Nantes', '15 Rue des Fleurs, 44300 Nantes'],
    ['15 Rue des Fleurs,44300 Nantes', '15 Rue des Fleurs, 44300 Nantes'],
    ['44300 Nantes', '44300 Nantes'],
    ['15 Rue des Fleurs', '15 Rue des Fleurs'],
  ])('formats %s as %s', (address, expected) => {
    expect(formatCcrtAddress(address)).toStrictEqual(expected);
  });
});

describe('getCcrtDemandTab', () => {
  it.each([
    ['A traiter', 'to_process'],
    ['Recontacté pour premier échange', 'in_progress'],
    ['Premier conseil téléphonique réalisé', 'in_progress'],
    ['Etude d’opportunité en cours', 'in_progress'],
    ['Etude d’opportunité réalisée', 'in_progress'],
    ['Étude de faisabilité votée en AG', 'in_progress'],
    ['Non pertinent', 'closed'],
    ['Réorienté vers France Rénov’', 'closed'],
    ['Projet abandonné par le prospect', 'closed'],
    ['Installation réalisée', 'completed'],
  ])('groups %s in %s', (status, expected) => {
    expect(getCcrtDemandTab({ status })).toStrictEqual(expected);
  });
});

describe('matchesCcrtDemandSearch', () => {
  const demand = {
    address: '5 avenue Carnot, 44000 Nantes',
    email: 'joelle@example.test',
    first_name: 'Joëlle',
    id: uuid(1),
    last_name: 'Martini',
    phone: '0611223344',
  };

  it.each([
    ['', true],
    ['  ', true],
    ['JOELLE', true],
    ['martini nantes', true],
    ['  nantes  Joëlle ', true],
    ['joelle@example.test', true],
    ['0611223344', true],
    [uuid(1), true],
    ['Martini Marseille', false],
    ['Paul', false],
  ])('matches "%s": %s', (search, expected) => {
    expect(matchesCcrtDemandSearch(demand, search)).toStrictEqual(expected);
  });
});

describe('admin moderation groups', () => {
  it.each([
    [false, null, 'awaiting_validation', true],
    [true, null, 'awaiting_validation', false],
    [false, '2026-11-01T10:00:00Z', 'awaiting_validation', false],
    [false, null, 'all', true],
    [true, null, 'all', true],
    [false, '2026-11-01T10:00:00Z', 'all', false],
    [false, '2026-11-01T10:00:00Z', 'archived', true],
    [false, null, 'archived', false],
  ] as const)('matches validated=%s, archived=%s in %s: %s', (validated, archived_at, tab, expected) => {
    expect(matchesCcrtAdminTab({ archived_at, validated }, tab)).toStrictEqual(expected);
  });

  it('warns only when no access holder has ever connected', () => {
    const user = {
      email: 'ccrt@example.fr',
      first_name: null,
      id: uuid(2),
      last_connection: null,
      last_name: null,
      role: 'ccrt' as const,
      structure_name: null,
    };
    expect(getCcrtAccessWarning(undefined)).toStrictEqual(null);
    expect(getCcrtAccessWarning([])).toStrictEqual('Aucun compte CCRT');
    expect(getCcrtAccessWarning([user])).toStrictEqual('Aucun CCRT ne s’est connecté');
    expect(getCcrtAccessWarning([user, { ...user, id: uuid(3), last_connection: '2026-10-23T10:00:00Z' }])).toStrictEqual(null);
  });
});
