import { describe, expect, it } from 'vitest';

import { uuid } from '@/tests/helpers';

import { getCcrtDemandTab, matchesCcrtDemandSearch } from './ccrt-workspace';

describe('getCcrtDemandTab', () => {
  it.each([
    ['A traiter', 'to_process'],
    ['Recontacté pour premier échange', 'in_progress'],
    ['Premier conseil téléphonique réalisé', 'in_progress'],
    ['Etude d’opportunité en cours', 'in_progress'],
    ['Etude d’opportunité réalisée', 'in_progress'],
    ['[Validation du projet] Etude de faisabilité votée en AG', 'in_progress'],
    ['Non pertinent', 'closed'],
    ['Réorienté vers France Rénov’', 'closed'],
    ['Projet abandonné par le prospect', 'closed'],
    ['Clôturées', 'closed'],
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
