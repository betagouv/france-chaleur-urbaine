import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import {
  buildSimulationSankey,
  computeSimulationIndicators,
  type FunnelColumn,
  type FunnelFilters,
  filterSimulationRows,
  funnelNodeName,
  type SimulationFunnelRow,
} from './simulation-funnel';

const row = (overrides: Partial<SimulationFunnelRow>): SimulationFunnelRow => ({
  addressResolved: true,
  ccrtDemandAvailable: false,
  hasSolution: true,
  heatNetworkAvailable: false,
  outcome: null,
  refusalAlreadyKnown: false,
  revised: 0,
  route: '/',
  simulations: 1,
  source: null,
  ...overrides,
});

const rows: SimulationFunnelRow[] = [
  row({ heatNetworkAvailable: true, outcome: 'heat_network_demand', simulations: 3 }),
  row({ heatNetworkAvailable: true, revised: 2, simulations: 5 }),
  row({ ccrtDemandAvailable: true, outcome: 'ccrt_demand', route: '/chaleur-renouvelable', simulations: 2 }),
  row({ outcome: 'france_renov_orientation', refusalAlreadyKnown: true, route: '/chaleur-renouvelable/resultat', simulations: 1 }),
  row({ route: '/chaleur-renouvelable/resultat', simulations: 4, source: 'bf7714ba-5aeb-4877-be73-35c6ba65a837' }),
  row({ hasSolution: false, simulations: 2 }),
];

describe('buildSimulationSankey', () => {
  it('builds entries by volume, situations and outcomes in fixed order, and sums the links', () => {
    expect(buildSimulationSankey(rows, { 'bf7714ba-5aeb-4877-be73-35c6ba65a837': 'Partenaire test' })).toStrictEqual({
      links: [
        { source: 0, target: 4, value: 8 },
        { source: 4, target: 8, value: 3 },
        { source: 4, target: 11, value: 5 },
        { source: 2, target: 5, value: 2 },
        { source: 5, target: 9, value: 2 },
        { source: 3, target: 6, value: 1 },
        { source: 6, target: 10, value: 1 },
        { source: 1, target: 6, value: 4 },
        { source: 6, target: 11, value: 4 },
        { source: 0, target: 7, value: 2 },
        { source: 7, target: 11, value: 2 },
      ],
      nodes: [
        { column: 'entry', fill: '#000091', key: '/', name: 'Page d’accueil' },
        { column: 'entry', fill: '#000091', key: 'source:bf7714ba-5aeb-4877-be73-35c6ba65a837', name: 'Partenaire test' },
        { column: 'entry', fill: '#000091', key: '/chaleur-renouvelable', name: 'Landing chaleur renouvelable' },
        { column: 'entry', fill: '#000091', key: 'refusal_email', name: 'Email de refus de raccordement' },
        { column: 'situation', fill: '#6a6af4', key: 'heat_network_france_renov', name: 'Réseau de chaleur + France Rénov’' },
        { column: 'situation', fill: '#6a6af4', key: 'ccrt', name: 'CCRT' },
        { column: 'situation', fill: '#6a6af4', key: 'france_renov', name: 'France Rénov’' },
        { column: 'situation', fill: '#6a6af4', key: 'france_renov_no_solution', name: 'France Rénov’ (aucune solution)' },
        { column: 'outcome', fill: '#0063cb', key: 'heat_network_demand', name: 'Demande réseau de chaleur' },
        { column: 'outcome', fill: '#18753c', key: 'ccrt_demand', name: 'Demande CCRT' },
        { column: 'outcome', fill: '#a558a0', key: 'france_renov_orientation', name: 'Orientation France Rénov’' },
        { column: 'outcome', fill: '#666666', key: 'none', name: 'Sans suite' },
      ],
    });
  });

  it('puts an unrecognized address in its own situation, whatever the other flags', () => {
    expect(buildSimulationSankey([row({ addressResolved: false, hasSolution: false, heatNetworkAvailable: true })]).nodes[1]).toStrictEqual(
      {
        column: 'situation',
        fill: '#6a6af4',
        key: 'france_renov_address_unresolved',
        name: 'France Rénov’ (adresse non reconnue)',
      }
    );
  });

  it('labels an unregistered source by its truncated id and returns no node for an empty period', () => {
    expect(buildSimulationSankey([row({ source: 'bf7714ba-5aeb-4877-be73-35c6ba65a837' })]).nodes[0].name).toStrictEqual(
      'Intégration bf7714ba'
    );
    expect(buildSimulationSankey([])).toStrictEqual({ links: [], nodes: [] });
  });
});

describe('computeSimulationIndicators', () => {
  it('counts each demand against the simulations where it was offered', () => {
    expect(computeSimulationIndicators(rows)).toStrictEqual({
      ccrtAvailable: 2,
      ccrtDemands: 2,
      franceRenovOrientations: 1,
      heatNetworkAvailable: 8,
      heatNetworkDemands: 3,
      revised: 2,
      simulations: 17,
      withoutOutcome: 11,
    });
  });
});

describe('filterSimulationRows', () => {
  const cases: TestCase<FunnelFilters, SimulationFunnelRow[]>[] = [
    { expectedOutput: rows, input: {}, label: 'no filter → every row' },
    { expectedOutput: rows, input: { entry: null, outcome: null, situation: null }, label: 'null filters → every row' },
    { expectedOutput: [rows[0], rows[1], rows[5]], input: { entry: '/' }, label: 'entry route' },
    { expectedOutput: [rows[4]], input: { entry: 'source:bf7714ba-5aeb-4877-be73-35c6ba65a837' }, label: 'entry source' },
    { expectedOutput: [rows[3]], input: { entry: 'refusal_email' }, label: 'entry refusal email, before the route' },
    { expectedOutput: [rows[0], rows[1]], input: { situation: 'heat_network_france_renov' }, label: 'situation' },
    { expectedOutput: [rows[1], rows[4], rows[5]], input: { outcome: 'none' }, label: 'outcome « none »' },
    { expectedOutput: [rows[1], rows[5]], input: { entry: '/', outcome: 'none' }, label: 'filters of two columns combine' },
    { expectedOutput: [], input: { situation: 'unknown' }, label: 'unknown key → nothing' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => expect(filterSimulationRows(rows, input)).toStrictEqual(expectedOutput));
});

describe('funnelNodeName', () => {
  const sourceLabels = { 'bf7714ba-5aeb-4877-be73-35c6ba65a837': 'Partenaire test' };
  const cases: TestCase<{ column: FunnelColumn; key: string }, string>[] = [
    { expectedOutput: 'Landing chaleur renouvelable', input: { column: 'entry', key: '/chaleur-renouvelable' }, label: 'entry route' },
    {
      expectedOutput: 'Partenaire test',
      input: { column: 'entry', key: 'source:bf7714ba-5aeb-4877-be73-35c6ba65a837' },
      label: 'entry registered source',
    },
    { expectedOutput: 'Email de refus de raccordement', input: { column: 'entry', key: 'refusal_email' }, label: 'entry refusal email' },
    {
      expectedOutput: 'France Rénov’ (aucune solution)',
      input: { column: 'situation', key: 'france_renov_no_solution' },
      label: 'situation',
    },
    { expectedOutput: 'Demande CCRT', input: { column: 'outcome', key: 'ccrt_demand' }, label: 'outcome' },
    { expectedOutput: 'unknown', input: { column: 'outcome', key: 'unknown' }, label: 'unknown key → the key itself' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) =>
    expect(funnelNodeName(input.column, input.key, sourceLabels)).toStrictEqual(expectedOutput)
  );
});
