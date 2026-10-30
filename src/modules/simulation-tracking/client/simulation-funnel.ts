import { businessRules } from '@/modules/app/business-rules';
import type { RouterOutput } from '@/modules/trpc/client';

import type { SimulationOutcome } from '../constants';

/**
 * Turns the aggregated simulation rows of `simulationTracking.getFunnel` into the entry → situation → outcome flow
 * (Sankey nodes and links) and the headline indicators of the admin page. Pure functions, unit-tested.
 */

export type SimulationFunnelRow = RouterOutput['simulationTracking']['getFunnel'][number];

export type FunnelColumn = 'entry' | 'situation' | 'outcome';

export type FunnelNode = {
  column: FunnelColumn;
  /** Stable key within the column (route, source id, situation or outcome key). */
  key: string;
  name: string;
  /** Node color, by identity: fixed per outcome, structural for the other columns. */
  fill: string;
};

export type FunnelLink = { source: number; target: number; value: number };

export type SimulationSankeyData = { nodes: FunnelNode[]; links: FunnelLink[] };

export const SIMULATION_START_LABELS: Record<string, string> = {
  '/': 'Page d’accueil',
  '/chaleur-renouvelable': 'Landing chaleur renouvelable',
  '/chaleur-renouvelable/resultat': 'Arrivée directe',
};
const REFUSAL_EMAIL_ENTRY = 'refusal_email';
const HEAT_NETWORK_MAX_DISTANCE = businessRules.fcrHeatNetworkMaxDistanceMeters.display;

/**
 * Contact proposed on the results page, decided by three flags: heat network proposable, CCRT accompaniment available,
 * at least one compatible heating solution. France Rénov' alone is split by the reason it is the only proposal.
 */
const SITUATION_KEYS = [
  'heat_network_ccrt',
  'heat_network_france_renov',
  'ccrt',
  'france_renov',
  'france_renov_no_solution',
  'france_renov_address_unresolved',
] as const;
type SituationKey = (typeof SITUATION_KEYS)[number];
const SITUATION_LABELS: Record<SituationKey, string> = {
  ccrt: 'CCRT',
  france_renov: 'France Rénov’',
  france_renov_address_unresolved: 'France Rénov’ (adresse non reconnue)',
  france_renov_no_solution: 'France Rénov’ (aucune solution)',
  heat_network_ccrt: 'Réseau de chaleur + CCRT',
  heat_network_france_renov: 'Réseau de chaleur + France Rénov’',
};

type OutcomeKey = SimulationOutcome | 'none';
const OUTCOME_KEYS = ['heat_network_demand', 'ccrt_demand', 'france_renov_orientation', 'none'] as const satisfies readonly OutcomeKey[];
export const OUTCOME_LABELS: Record<OutcomeKey, string> = {
  ccrt_demand: 'Demande CCRT',
  france_renov_orientation: 'Orientation France Rénov’',
  heat_network_demand: 'Demande réseau de chaleur',
  none: 'Sans suite',
};
/** Outcome colors (DSFR palette, validated for color-vision deficiencies); « sans suite » is a neutral marker. */
export const OUTCOME_COLORS: Record<OutcomeKey, string> = {
  ccrt_demand: '#18753c',
  france_renov_orientation: '#a558a0',
  heat_network_demand: '#0063cb',
  none: '#666666',
};
/** Structural colors of the first two columns: they carry no identity, only the outcomes do. */
export const ENTRY_COLOR = '#000091';
export const SITUATION_COLOR = '#6a6af4';

export type FunnelLegendItem = { label: string; description: string; color: string };

/**
 * Every possible value of each column, in display order, with its meaning: the self-documentation of the admin screen
 * (help dialog). Kept next to the labels so the chart and the help can never drift.
 */
export const FUNNEL_LEGEND: Record<FunnelColumn, FunnelLegendItem[]> = {
  entry: [
    {
      color: ENTRY_COLOR,
      description: 'Formulaire de la page d’accueil validé en mode « comparer toutes les solutions ».',
      label: SIMULATION_START_LABELS['/'],
    },
    {
      color: ENTRY_COLOR,
      description: 'Formulaire de la page /chaleur-renouvelable validé (bouton « Comparer les solutions »).',
      label: SIMULATION_START_LABELS['/chaleur-renouvelable'],
    },
    {
      color: ENTRY_COLOR,
      description:
        'Page de résultats ouverte sans passer par un formulaire : lien partagé, favori, rechargement de la page ou lien depuis un email.',
      label: SIMULATION_START_LABELS['/chaleur-renouvelable/resultat'],
    },
    {
      color: ENTRY_COLOR,
      description:
        'Arrivée depuis l’email « Raccordement non réalisable » : le refus est connu, le réseau de chaleur est retiré des solutions. Prioritaire sur les autres entrées.',
      label: 'Email de refus de raccordement',
    },
    {
      color: ENTRY_COLOR,
      description:
        'Simulation démarrée depuis une intégration iframe partenaire (paramètre source de l’URL) : une entrée par intégration, nommée d’après le registre des intégrations.',
      label: 'Intégration (nom du partenaire)',
    },
  ],
  outcome: [
    {
      color: OUTCOME_COLORS.heat_network_demand,
      description: 'Demande de raccordement classique créée depuis la page de résultats (une demande dédoublonnée ne compte pas).',
      label: OUTCOME_LABELS.heat_network_demand,
    },
    {
      color: OUTCOME_COLORS.ccrt_demand,
      description: 'Demande d’accompagnement chaleur renouvelable créée, à valider puis visible par les CCRT du territoire.',
      label: OUTCOME_LABELS.ccrt_demand,
    },
    {
      color: OUTCOME_COLORS.france_renov_orientation,
      description: 'Clic sur « Prendre rendez-vous avec un·e conseiller·ère » France Rénov’ : issue sans demande dans FCU.',
      label: OUTCOME_LABELS.france_renov_orientation,
    },
    {
      color: OUTCOME_COLORS.none,
      description: 'Aucune des trois issues enregistrée. Une demande faite plus tard, dans une autre session, n’est pas reliée.',
      label: OUTCOME_LABELS.none,
    },
  ],
  situation: [
    {
      color: SITUATION_COLOR,
      description: `Demande de raccordement au gestionnaire du réseau, ou demande d’accompagnement CCRT si un refus a déjà été reçu. Réseau proposable : adresse éligible à moins de ${HEAT_NETWORK_MAX_DISTANCE} d’un réseau, radiateurs à eau, aucun refus connu. CCRT : immeuble en chauffage collectif dans un territoire couvert par un compte CCRT actif.`,
      label: SITUATION_LABELS.heat_network_ccrt,
    },
    {
      color: SITUATION_COLOR,
      description:
        'Demande de raccordement au gestionnaire du réseau, ou orientation France Rénov’ si un refus a déjà été reçu : réseau proposable, mais pas d’accompagnement CCRT (maison individuelle, ou territoire sans compte CCRT).',
      label: SITUATION_LABELS.heat_network_france_renov,
    },
    {
      color: SITUATION_COLOR,
      description: `Formulaire d’accompagnement CCRT directement : immeuble en chauffage collectif dans un territoire couvert, sans réseau proposable (réseau à plus de ${HEAT_NETWORK_MAX_DISTANCE}, adresse non éligible, radiateurs électriques ou refus déjà connu).`,
      label: SITUATION_LABELS.ccrt,
    },
    {
      color: SITUATION_COLOR,
      description:
        'Ni réseau proposable ni accompagnement CCRT : des solutions alternatives (géothermie, biomasse, pompes à chaleur…) sont affichées, avec l’orientation vers un·e conseiller·ère France Rénov’.',
      label: SITUATION_LABELS.france_renov,
    },
    {
      color: SITUATION_COLOR,
      description:
        'Aucune solution de chauffage compatible avec le logement et ses paramètres : la page affiche les gestes de sobriété et l’orientation France Rénov’ seulement.',
      label: SITUATION_LABELS.france_renov_no_solution,
    },
    {
      color: SITUATION_COLOR,
      description:
        'La Base Adresse Nationale n’a trouvé aucun numéro pour l’adresse saisie (voie sans numéro, adresse introuvable) : résultats calculés sans bâtiment, sans éligibilité réseau ni territoire, orientation France Rénov’ seulement.',
      label: SITUATION_LABELS.france_renov_address_unresolved,
    },
  ],
};

const entryKey = (row: SimulationFunnelRow) =>
  row.refusalAlreadyKnown ? REFUSAL_EMAIL_ENTRY : row.source ? `source:${row.source}` : row.route;

const entryLabel = (key: string, sourceLabels: Record<string, string>) =>
  key === REFUSAL_EMAIL_ENTRY
    ? 'Email de refus de raccordement'
    : key.startsWith('source:')
      ? (sourceLabels[key.slice('source:'.length)] ?? `Intégration ${key.slice('source:'.length, 'source:'.length + 8)}`)
      : (SIMULATION_START_LABELS[key] ?? key);

const situationKey = (row: SimulationFunnelRow): SituationKey =>
  !row.addressResolved
    ? 'france_renov_address_unresolved'
    : row.heatNetworkAvailable && row.ccrtDemandAvailable
      ? 'heat_network_ccrt'
      : row.heatNetworkAvailable
        ? 'heat_network_france_renov'
        : row.ccrtDemandAvailable
          ? 'ccrt'
          : row.hasSolution
            ? 'france_renov'
            : 'france_renov_no_solution';

const outcomeKey = (row: SimulationFunnelRow): OutcomeKey => row.outcome ?? 'none';

const sumBy = <Key extends string>(rows: SimulationFunnelRow[], keyOf: (row: SimulationFunnelRow) => Key) =>
  rows.reduce((totals, row) => totals.set(keyOf(row), (totals.get(keyOf(row)) ?? 0) + row.simulations), new Map<Key, number>());

/**
 * Builds the Sankey data: entries sorted by volume, situations and outcomes in their fixed order, only the nodes that
 * carry simulations. Links are entry → situation and situation → outcome volumes.
 */
export const buildSimulationSankey = (rows: SimulationFunnelRow[], sourceLabels: Record<string, string> = {}): SimulationSankeyData => {
  const entryTotals = sumBy(rows, entryKey);
  const situationTotals = sumBy(rows, situationKey);
  const outcomeTotals = sumBy(rows, outcomeKey);

  const nodes: FunnelNode[] = [
    ...[...entryTotals.entries()]
      .sort(([keyA, totalA], [keyB, totalB]) => totalB - totalA || keyA.localeCompare(keyB))
      .map(([key]): FunnelNode => ({ column: 'entry', fill: ENTRY_COLOR, key, name: entryLabel(key, sourceLabels) })),
    ...SITUATION_KEYS.filter((key) => situationTotals.has(key)).map(
      (key): FunnelNode => ({ column: 'situation', fill: SITUATION_COLOR, key, name: SITUATION_LABELS[key] })
    ),
    ...OUTCOME_KEYS.filter((key) => outcomeTotals.has(key)).map(
      (key): FunnelNode => ({ column: 'outcome', fill: OUTCOME_COLORS[key], key, name: OUTCOME_LABELS[key] })
    ),
  ];
  const nodeIndex = (column: FunnelColumn, key: string) => nodes.findIndex((node) => node.column === column && node.key === key);

  const linkTotals = new Map<string, FunnelLink>();
  const addLink = (source: number, target: number, value: number) => {
    const linkKey = `${source}→${target}`;
    const link = linkTotals.get(linkKey) ?? { source, target, value: 0 };
    linkTotals.set(linkKey, { ...link, value: link.value + value });
  };
  rows.forEach((row) => {
    const situation = nodeIndex('situation', situationKey(row));
    addLink(nodeIndex('entry', entryKey(row)), situation, row.simulations);
    addLink(situation, nodeIndex('outcome', outcomeKey(row)), row.simulations);
  });

  return { links: [...linkTotals.values()], nodes };
};

export type SimulationIndicators = {
  simulations: number;
  revised: number;
  heatNetworkDemands: number;
  /** Simulations where the heat network demand was offered (denominator of `heatNetworkDemands`). */
  heatNetworkAvailable: number;
  ccrtDemands: number;
  /** Simulations where the CCRT demand was offered (denominator of `ccrtDemands`). */
  ccrtAvailable: number;
  franceRenovOrientations: number;
  withoutOutcome: number;
};

/** Headline indicators, each demand rate against the simulations where that demand was actually offered. */
export const computeSimulationIndicators = (rows: SimulationFunnelRow[]): SimulationIndicators =>
  rows.reduce<SimulationIndicators>(
    (indicators, row) => ({
      ccrtAvailable: indicators.ccrtAvailable + (row.ccrtDemandAvailable ? row.simulations : 0),
      ccrtDemands: indicators.ccrtDemands + (row.outcome === 'ccrt_demand' ? row.simulations : 0),
      franceRenovOrientations: indicators.franceRenovOrientations + (row.outcome === 'france_renov_orientation' ? row.simulations : 0),
      heatNetworkAvailable: indicators.heatNetworkAvailable + (row.heatNetworkAvailable ? row.simulations : 0),
      heatNetworkDemands: indicators.heatNetworkDemands + (row.outcome === 'heat_network_demand' ? row.simulations : 0),
      revised: indicators.revised + row.revised,
      simulations: indicators.simulations + row.simulations,
      withoutOutcome: indicators.withoutOutcome + (row.outcome === null ? row.simulations : 0),
    }),
    {
      ccrtAvailable: 0,
      ccrtDemands: 0,
      franceRenovOrientations: 0,
      heatNetworkAvailable: 0,
      heatNetworkDemands: 0,
      revised: 0,
      simulations: 0,
      withoutOutcome: 0,
    }
  );
