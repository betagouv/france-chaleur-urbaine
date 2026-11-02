import Tag from '@codegouvfr/react-dsfr/Tag';
import { keepPreviousData } from '@tanstack/react-query';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';

import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import {
  ESPACE_EXTERIEUR_VALUES,
  type EspaceExterieur,
  getEspaceExterieurLabel,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import trpc from '@/modules/trpc/client';
import { formatAsISODate } from '@/utils/date';

import { SimulationsFunnelHelpDialog } from './SimulationsFunnelHelpDialog';
import { SimulationsSankey } from './SimulationsSankey';
import {
  buildSimulationSankey,
  computeSimulationIndicators,
  FUNNEL_COLUMN_LABELS,
  FUNNEL_COLUMNS,
  type FunnelColumn,
  type FunnelFilters,
  type FunnelNode,
  filterSimulationRows,
  funnelNodeName,
  OUTCOME_KEYS,
  SITUATION_KEYS,
  type SimulationIndicators,
} from './simulation-funnel';

const today = new Date();
const defaultTo = formatAsISODate(today);
const defaultFrom = formatAsISODate(new Date(today.getFullYear(), today.getMonth() - 2, 1));

const filtersParsers = {
  dateFrom: parseAsString.withDefault(defaultFrom),
  dateTo: parseAsString.withDefault(defaultTo),
  departementCode: parseAsString,
  // node filters, set by clicking a node of the flow (entry keys are open: routes, `source:<id>`, `refusal_email`)
  entry: parseAsString,
  housingType: parseAsStringLiteral(TYPE_LOGEMENT_VALUES),
  outcome: parseAsStringLiteral(OUTCOME_KEYS),
  outdoorSpace: parseAsStringLiteral(ESPACE_EXTERIEUR_VALUES),
  radiatorType: parseAsStringLiteral(TYPE_RADIATEUR_VALUES),
  situation: parseAsStringLiteral(SITUATION_KEYS),
};

/**
 * Admin view of the renewable heating simulations: headline indicators and the entry → situation → outcome flow,
 * filterable by period and simulation inputs (query) and by clicking the nodes of the flow (on the aggregated rows).
 * Reads `simulationTracking.getFunnel`.
 */
const SimulationsConversionPage = () => {
  const [{ dateFrom, dateTo, departementCode, housingType, outdoorSpace, radiatorType, entry, situation, outcome }, setFilters] =
    useQueryStates(filtersParsers);
  const nodeFilters: FunnelFilters = { entry, outcome, situation };

  const { data: rows = [], isLoading } = trpc.simulationTracking.getFunnel.useQuery(
    {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(`${dateTo}T23:59:59`),
      departementCode: departementCode || undefined,
      housingType: housingType ?? undefined,
      outdoorSpace: outdoorSpace ?? undefined,
      radiatorType: radiatorType ?? undefined,
    },
    { placeholderData: keepPreviousData }
  );
  const { data: integrations = [] } = trpc.conversionTracking.sources.list.useQuery({ includeArchived: true });
  const sourceLabels = useMemo(
    () => Object.fromEntries(integrations.map((integration) => [integration.id, integration.label])),
    [integrations]
  );

  const filteredRows = useMemo(() => filterSimulationRows(rows, { entry, outcome, situation }), [rows, entry, outcome, situation]);
  const sankeyData = useMemo(() => buildSimulationSankey(filteredRows, sourceLabels), [filteredRows, sourceLabels]);
  const indicators = useMemo(() => computeSimulationIndicators(filteredRows), [filteredRows]);

  // a second click on the filtered node releases its column
  const handleNodeClick = useCallback(
    (node: FunnelNode) => setFilters({ [node.column]: nodeFilters[node.column] === node.key ? null : node.key }),
    [setFilters, nodeFilters.entry, nodeFilters.situation, nodeFilters.outcome]
  );

  return (
    <SimplePage
      title="Conversion du simulateur chaleur renouvelable"
      description="Flux des simulations : page d’arrivée → contact proposé → issue"
      mode="authenticated"
      layout="center"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h1" color="blue-france" className="mb-0">
          Conversion du simulateur chaleur renouvelable
        </Heading>
        <div className="flex flex-wrap items-center gap-4">
          <SimulationsFunnelHelpDialog />
          <Link href="/admin/conversion" className="fr-link fr-link--icon-right fr-icon-arrow-right-line">
            Conversion par source
          </Link>
        </div>
      </div>
      <p className="mb-0 text-sm text-(--text-mention-grey)">
        Une simulation par adresse testée sur la page de résultats. Les demandes sont rapportées aux seules simulations où elles étaient
        proposées ; les simulations des IP bannies sont exclues. Un clic sur une case du flux filtre sur cette valeur. Les affichages des
        pages restent sur <Link href="/admin/conversion">Conversion par source</Link>.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <Input
          label="Du"
          className="mb-0"
          nativeInputProps={{ onChange: (event) => setFilters({ dateFrom: event.target.value }), type: 'date', value: dateFrom }}
        />
        <Input
          label="Au"
          className="mb-0"
          nativeInputProps={{ onChange: (event) => setFilters({ dateTo: event.target.value }), type: 'date', value: dateTo }}
        />
        <Select
          label="Type de logement"
          className="mb-0"
          nativeSelectProps={{
            onChange: (event) => setFilters({ housingType: (event.target.value || null) as TypeLogement | null }),
            value: housingType ?? '',
          }}
          options={[{ label: 'Tous', value: '' }, ...typeLogementOptions.map((option) => ({ label: option.label, value: option.value }))]}
        />
        <Select
          label="Type de radiateurs"
          className="mb-0"
          nativeSelectProps={{
            onChange: (event) => setFilters({ radiatorType: (event.target.value || null) as TypeRadiateur | null }),
            value: radiatorType ?? '',
          }}
          options={[{ label: 'Tous', value: '' }, ...typeRadiateurOptions.map((option) => ({ label: option.label, value: option.value }))]}
        />
        <Select
          label="Espace extérieur"
          className="mb-0"
          nativeSelectProps={{
            onChange: (event) => setFilters({ outdoorSpace: (event.target.value || null) as EspaceExterieur | null }),
            value: outdoorSpace ?? '',
          }}
          options={[
            { label: 'Tous', value: '' },
            ...ESPACE_EXTERIEUR_VALUES.map((value) => ({ label: getEspaceExterieurLabel(value), value })),
          ]}
        />
        <Input
          label="Département"
          className="mb-0 w-32"
          nativeInputProps={{
            maxLength: 3,
            onChange: (event) => setFilters({ departementCode: event.target.value.trim() || null }),
            placeholder: 'ex. 75',
            value: departementCode ?? '',
          }}
        />
      </div>

      <FunnelFilterTags filters={nodeFilters} sourceLabels={sourceLabels} onRemove={(column) => setFilters({ [column]: null })} />

      <SimulationIndicatorTiles indicators={indicators} />

      {isLoading ? (
        <p className="mb-0 text-(--text-mention-grey)">Chargement…</p>
      ) : filteredRows.length === 0 ? (
        <p className="mb-0 text-(--text-mention-grey)">Aucune simulation sur cette période.</p>
      ) : (
        <SimulationsSankey data={sankeyData} onNodeClick={handleNodeClick} />
      )}
    </SimplePage>
  );
};

export default SimulationsConversionPage;

const formatRate = (numerator: number, denominator: number) => (denominator > 0 ? `${Math.round((numerator / denominator) * 100)} %` : '—');

type FunnelFilterTagsProps = {
  filters: FunnelFilters;
  sourceLabels: Record<string, string>;
  onRemove: (column: FunnelColumn) => void;
};

/** Active node filters, one dismissible tag per filtered column; nothing when the flow is unfiltered. */
function FunnelFilterTags({ filters, sourceLabels, onRemove }: FunnelFilterTagsProps) {
  const activeFilters = FUNNEL_COLUMNS.flatMap((column) => {
    const key = filters[column];
    return key ? [{ column, key }] : [];
  });
  if (activeFilters.length === 0) {
    return null;
  }
  return (
    <ul className="mb-0 flex list-none flex-wrap gap-2 p-0">
      {activeFilters.map(({ column, key }) => (
        <li key={column} className="p-0">
          <Tag dismissible small nativeButtonProps={{ onClick: () => onRemove(column), title: 'Retirer ce filtre' }}>
            {FUNNEL_COLUMN_LABELS[column]} : {funnelNodeName(column, key, sourceLabels)}
          </Tag>
        </li>
      ))}
    </ul>
  );
}

type SimulationIndicatorTilesProps = { indicators: SimulationIndicators };

/** Four headline figures: volume, and each outcome against the simulations where it was offered. */
function SimulationIndicatorTiles({ indicators }: SimulationIndicatorTilesProps) {
  const tiles = [
    {
      detail: `${indicators.revised} avec paramètres modifiés (${formatRate(indicators.revised, indicators.simulations)})`,
      label: 'Simulations',
      value: String(indicators.simulations),
    },
    {
      detail: `${indicators.heatNetworkDemands} sur ${indicators.heatNetworkAvailable} simulations avec réseau proposé`,
      label: 'Demandes réseau de chaleur',
      value: formatRate(indicators.heatNetworkDemands, indicators.heatNetworkAvailable),
    },
    {
      detail: `${indicators.ccrtDemands} sur ${indicators.ccrtAvailable} simulations avec accompagnement proposé`,
      label: 'Demandes CCRT',
      value: formatRate(indicators.ccrtDemands, indicators.ccrtAvailable),
    },
    {
      detail: `${indicators.franceRenovOrientations} clics « prendre rendez-vous » · ${indicators.withoutOutcome} simulations sans suite`,
      label: 'Orientations France Rénov’',
      value: formatRate(indicators.franceRenovOrientations, indicators.simulations),
    },
  ];
  return (
    <dl className="mb-0 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-sm bg-(--background-alt-blue-france) px-4 py-3">
          <dt className="text-sm text-(--text-mention-grey)">{tile.label}</dt>
          <dd className="mb-1 ml-0 text-2xl font-bold tabular-nums">{tile.value}</dd>
          <dd className="mb-0 ml-0 text-xs text-(--text-mention-grey)">{tile.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
