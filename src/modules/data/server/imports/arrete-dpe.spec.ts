import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import {
  type ArreteDpeChanges,
  type ArreteDpeRow,
  computeArreteDpeChanges,
  type ExistingNetwork,
  parseArreteDpeCsv,
  parseArreteDpeHtml,
  toArreteDpeCsv,
} from './arrete-dpe';

const buildRow = (overrides: Partial<ArreteDpeRow> = {}): ArreteDpeRow => ({
  annee_reference: 'Moyenne',
  contenu_co2: 0.175,
  contenu_co2_acv: 0.211,
  identifiant: '0102C',
  localisation: "PLATEAU D'HAUTEVILLE",
  nom: "RÉSEAU DE CHALEUR D'HAUTEVILLE LOMPNES",
  taux_enrr: 51.1,
  ...overrides,
});

const buildNetwork = (overrides: Partial<ExistingNetwork> = {}): ExistingNetwork => ({
  'contenu CO2': 0.2,
  'contenu CO2 ACV': 0.25,
  'Identifiant reseau': '0102C',
  id_fcu: 1,
  'Moyenne-annee-DPE': '2023',
  'Taux EnR&R': 40,
  ...overrides,
});

const annexHtml = `
<h2>ANNEXE</h2>
<table>
  <thead>
    <tr><th>Identifiant réseau</th><th>NOM DU RÉSEAU</th><th>LOCALISATION</th><th>Contenu CO₂ [kgCO2/kWh]</th><th>Contenu CO2 ACV [kgCO2/kWh]</th><th>Taux EnR&amp;R [%]</th><th>Année de référence du taux</th></tr>
  </thead>
  <tbody>
    <tr><td><p>0102C</p></td><td>RÉSEAU DE CHALEUR D'HAUTEVILLE LOMPNES</td><td>PLATEAU&nbsp;D'HAUTEVILLE</td><td>0,175</td><td>0,211</td><td>51,1%</td><td>Moyenne</td></tr>
    <tr class="odd"><td>0103C</td><td>OYONNAX <b>BIOCHALEUR</b></td><td>OYONNAX</td><td>0,039</td><td>0,062</td><td>85,7 %</td><td>2024</td></tr>
    <tr><td>1234F</td><td>R&#201;SEAU DE FROID</td><td>PARIS</td><td>0,015</td><td>-</td><td></td><td>2024</td></tr>
    <tr><td>Total</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>
`;

const expectedRows: ArreteDpeRow[] = [
  buildRow(),
  buildRow({
    annee_reference: '2024',
    contenu_co2: 0.039,
    contenu_co2_acv: 0.062,
    identifiant: '0103C',
    localisation: 'OYONNAX',
    nom: 'OYONNAX BIOCHALEUR',
    taux_enrr: 85.7,
  }),
  buildRow({
    annee_reference: '2024',
    contenu_co2: 0.015,
    contenu_co2_acv: null,
    identifiant: '1234F',
    localisation: 'PARIS',
    nom: 'RÉSEAU DE FROID',
    taux_enrr: null,
  }),
];

describe('parseArreteDpeHtml', () => {
  it('extracts the network rows of the annex, decoding entities and French numbers', () => {
    expect(parseArreteDpeHtml(annexHtml)).toStrictEqual(expectedRows);
  });

  it('rejects duplicated identifiers', () => {
    const duplicated = `${annexHtml}<table><tr><td>0102C</td><td>X</td><td>Y</td><td>0,1</td><td>0,2</td><td>10%</td><td>2024</td></tr></table>`;
    expect(() => parseArreteDpeHtml(duplicated)).toThrow('Identifiants réseau en double');
  });

  it('rejects unparseable numbers', () => {
    const invalid = '<table><tr><td>0102C</td><td>X</td><td>Y</td><td>n.d.</td><td>0,2</td><td>10%</td><td>2024</td></tr></table>';
    expect(() => parseArreteDpeHtml(invalid)).toThrow('Valeur numérique invalide "n.d." pour le réseau 0102C');
  });
});

describe('CSV round trip', () => {
  it('serializes then parses the rows unchanged', () => {
    const csv = toArreteDpeCsv(expectedRows);

    expect(csv.split('\n')[0]).toStrictEqual('identifiant,nom,localisation,contenu_co2,contenu_co2_acv,taux_enrr,annee_reference');
    expect(parseArreteDpeCsv(csv)).toStrictEqual(expectedRows);
  });

  it('rejects an invalid reference year', () => {
    const csv = 'identifiant,nom,localisation,contenu_co2,contenu_co2_acv,taux_enrr,annee_reference\n0102C,X,Y,0.1,0.2,10,20XX\n';
    expect(() => parseArreteDpeCsv(csv)).toThrow();
  });
});

describe('computeArreteDpeChanges', () => {
  const noChanges: ArreteDpeChanges = { resets: [], unknownIdentifiants: [], updates: [] };

  const cases: TestCase<{ networks: ExistingNetwork[]; rows: ArreteDpeRow[] }, ArreteDpeChanges>[] = [
    {
      expectedOutput: {
        ...noChanges,
        updates: [
          {
            after: { 'contenu CO2': 0.175, 'contenu CO2 ACV': 0.211, 'Moyenne-annee-DPE': 'Moyenne', 'Taux EnR&R': 51.1 },
            before: { 'contenu CO2': 0.2, 'contenu CO2 ACV': 0.25, 'Moyenne-annee-DPE': '2023', 'Taux EnR&R': 40 },
            id_fcu: 1,
            identifiant: '0102C',
          },
        ],
      },
      input: { networks: [buildNetwork()], rows: [buildRow()] },
      label: 'listed network with different values → update',
    },
    {
      expectedOutput: noChanges,
      input: {
        networks: [buildNetwork({ 'contenu CO2': 0.175, 'contenu CO2 ACV': 0.211, 'Moyenne-annee-DPE': 'Moyenne', 'Taux EnR&R': 51.1 })],
        rows: [buildRow()],
      },
      label: 'listed network with identical values → no change',
    },
    {
      expectedOutput: {
        ...noChanges,
        resets: [
          {
            after: { 'contenu CO2': null, 'contenu CO2 ACV': null, 'Moyenne-annee-DPE': null, 'Taux EnR&R': null },
            before: { 'contenu CO2': 0.2, 'contenu CO2 ACV': 0.25, 'Moyenne-annee-DPE': '2023', 'Taux EnR&R': 40 },
            id_fcu: 1,
            identifiant: '0999C',
          },
        ],
        unknownIdentifiants: ['0102C'],
      },
      input: { networks: [buildNetwork({ 'Identifiant reseau': '0999C' })], rows: [buildRow()] },
      label: 'network absent from the arrêté with values → reset, arrêté row reported',
    },
    {
      expectedOutput: { ...noChanges, unknownIdentifiants: ['0102C'] },
      input: {
        networks: [
          buildNetwork({
            'contenu CO2': null,
            'contenu CO2 ACV': null,
            'Identifiant reseau': '0999C',
            'Moyenne-annee-DPE': null,
            'Taux EnR&R': null,
          }),
        ],
        rows: [buildRow()],
      },
      label: 'network absent from the arrêté without values → no change',
    },
    {
      expectedOutput: {
        ...noChanges,
        resets: [
          {
            after: { 'contenu CO2': null, 'contenu CO2 ACV': null, 'Moyenne-annee-DPE': null, 'Taux EnR&R': null },
            before: { 'contenu CO2': null, 'contenu CO2 ACV': null, 'Moyenne-annee-DPE': null, 'Taux EnR&R': 40 },
            id_fcu: 1,
            identifiant: null,
          },
        ],
        unknownIdentifiants: ['0102C'],
      },
      input: {
        networks: [buildNetwork({ 'contenu CO2': null, 'contenu CO2 ACV': null, 'Identifiant reseau': null, 'Moyenne-annee-DPE': null })],
        rows: [buildRow()],
      },
      label: 'network without identifier holding values → reset, arrêté row reported',
    },
    {
      expectedOutput: { ...noChanges, unknownIdentifiants: ['0103C', '5555C'] },
      input: {
        networks: [buildNetwork({ 'contenu CO2': 0.175, 'contenu CO2 ACV': 0.211, 'Moyenne-annee-DPE': 'Moyenne', 'Taux EnR&R': 51.1 })],
        rows: [buildRow(), buildRow({ identifiant: '5555C' }), buildRow({ identifiant: '0103C' })],
      },
      label: 'arrêté identifiers unknown in database → reported sorted',
    },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(computeArreteDpeChanges(input.networks, input.rows)).toStrictEqual(expectedOutput);
  });
});
