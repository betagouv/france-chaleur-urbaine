import Badge from '@codegouvfr/react-dsfr/Badge';
import { keepPreviousData } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import Checkbox from '@/components/form/dsfr/Checkbox';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import {
  type ConversionChannel,
  type ConversionStatsGranularity,
  conversionChannels,
  conversionStatsGranularities,
} from '@/modules/conversion-tracking/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import cx from '@/utils/cx';
import { formatAsISODate, formatFrenchDate } from '@/utils/date';

const today = new Date();
const defaultTo = formatAsISODate(today);
const defaultFrom = formatAsISODate(new Date(today.getFullYear(), today.getMonth() - 11, 1));

/** Formate un taux de conversion (0–1) en pourcentage pour l'affichage ; `—` si non calculable. */
const formatRate = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`);
/** Idem `formatRate` mais vide (au lieu de `—`) pour l'export CSV. */
const formatRateForExport = (rate: number | null) => (rate === null ? '' : `${Math.round(rate * 100)}%`);
const channelLabel: Record<ConversionChannel, string> = { iframe: 'Iframe', internal: 'Interne' };

type StatRow = RouterOutput['conversionTracking']['getStats'][number];

/** Lien vers l'écran anti-abus filtré sur le canal de la ligne (source d'intégration, sinon route interne). */
const abusePageHref = (row: StatRow) => {
  const params = new URLSearchParams();
  if (row.source) params.set('source', row.source);
  else if (row.route) params.set('route', row.route);
  if (row.host) params.set('host', row.host);
  return `/admin/conversion/abus?${params.toString()}`;
};

/** Segment de flèche du funnel : barre horizontale avec le taux à l'intérieur `──{taux}──▶`. */
const funnelArrow = (rate: number | null) => (
  <span className="flex flex-col items-center px-1.5 leading-tight text-(--text-mention-grey)">
    <span className="text-xs">
      ──<span className="mx-0.5 inline-block w-[4.5ch] text-center tabular-nums">{formatRate(rate)}</span>──▶
    </span>
    {/* espaceur invisible : réserve la hauteur de la ligne « ✓ » pour aligner tous les segments */}
    <span className="invisible text-xs">✓</span>
  </span>
);

/** Étape du funnel : compteur + `(✓ nb éligibles)` en dessous (espaceur invisible si pas d'éligibles). */
const funnelStage = (value: number, eligible: number | null) => (
  <span className="flex w-14 flex-col items-center tabular-nums leading-tight">
    <span>{value}</span>
    <span className={cx('text-xs text-(--text-mention-grey)', (eligible === null || value === 0) && 'invisible')}>(✓ {eligible ?? 0})</span>
  </span>
);

/** Cellule funnel : Affichages ─%▶ Tests (✓ élig.) ─%▶ Demandes (✓ élig.), centrée verticalement. */
const funnelCell = (row: StatRow) => (
  <div className="flex items-center whitespace-nowrap">
    {funnelStage(row.displays, null)}
    {funnelArrow(row.testRate)}
    {funnelStage(row.tests, row.testsEligible)}
    {funnelArrow(row.demandRate)}
    {funnelStage(row.demands, row.demandsEligible)}
  </div>
);

/** Représentation texte du funnel pour l'export. */
const funnelExport = (row: StatRow) =>
  `${row.displays} →${formatRateForExport(row.testRate)}→ ${row.tests} (${row.testsEligible} élig.) →${formatRateForExport(row.demandRate)}→ ${row.demands} (${row.demandsEligible} élig.)`;

const filtersParsers = {
  channel: parseAsStringLiteral(conversionChannels),
  dateFrom: parseAsString.withDefault(defaultFrom),
  dateTo: parseAsString.withDefault(defaultTo),
  granularity: parseAsStringLiteral(conversionStatsGranularities).withDefault('month'),
  groupByHost: parseAsBoolean.withDefault(false),
  groupByPage: parseAsBoolean.withDefault(false),
  showCreatedAt: parseAsBoolean.withDefault(false),
  source: parseAsString,
};

const ConversionStatsPage = () => {
  const [{ channel, dateFrom, dateTo, granularity, groupByHost, groupByPage, showCreatedAt, source }, setFilters] =
    useQueryStates(filtersParsers);

  const { data: rows = [], isLoading } = trpc.conversionTracking.getStats.useQuery(
    {
      channel: channel || undefined,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(`${dateTo}T23:59:59`),
      granularity,
      groupByHost,
      groupByPage,
      source: source || undefined,
    },
    { placeholderData: keepPreviousData }
  );

  const { data: integrations = [] } = trpc.conversionTracking.sources.list.useQuery({ includeArchived: true });

  const sourceOptions = useMemo(() => {
    const options = [
      { label: 'Toutes les sources', value: '' },
      ...integrations.map((integration) => ({
        label: integration.archived_at ? `${integration.label} (archivée)` : integration.label,
        value: integration.id,
      })),
    ];
    if (source && !integrations.some((integration) => integration.id === source)) {
      options.push({ label: `${source} (hors registre)`, value: source });
    }
    return options;
  }, [integrations, source]);

  const columns: ColumnDef<StatRow>[] = useMemo(
    () => [
      {
        accessorFn: (row) => channelLabel[row.channel],
        cell: ({ row }) => <span className="text-(--text-mention-grey)">{channelLabel[row.original.channel]}</span>,
        header: 'Canal',
        id: 'channel',
        width: '90px',
      },
      {
        accessorFn: (row) => row.label,
        // Contexte : label + drills (page / hôte / créée) fusionnés en sous-lignes plutôt qu'en colonnes séparées.
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex flex-col gap-0.5 break-all">
              <span>
                {r.label}
                {r.unregistered && (
                  <span title="Intégration reçue mais absente du registre des intégrations">
                    <Badge severity="warning" small noIcon className="fr-ml-1w">
                      hors registre
                    </Badge>
                  </span>
                )}
              </span>
              {groupByPage && r.page && <span className="text-xs text-(--text-mention-grey)">Page : {r.page}</span>}
              {groupByHost && r.host && <span className="text-xs text-(--text-mention-grey)">Hôte : {r.host}</span>}
              {showCreatedAt && r.sourceCreatedAt && (
                <span className="text-xs text-(--text-mention-grey)">Créée le {formatFrenchDate(new Date(r.sourceCreatedAt))}</span>
              )}
            </div>
          );
        },
        flex: 2,
        header: 'Intégration / route',
        id: 'label',
      },
      {
        accessorFn: (row) => row.period ?? undefined,
        cell: ({ row }) => <span className="whitespace-nowrap">{row.original.period ?? '—'}</span>,
        header: 'Période',
        id: 'period',
        sortUndefined: 'last',
        width: '110px',
      },
      {
        cell: ({ row }) => funnelCell(row.original),
        enableSorting: false,
        exportFn: (row) => funnelExport(row),
        exportHeader: 'Funnel',
        header: 'Affichages → Tests → Demandes',
        id: 'funnel',
        width: '380px',
      },
      {
        accessorFn: (row) => row.distinctIp,
        align: 'right',
        cell: ({ row }) =>
          row.original.distinctIp > 0 ? (
            <Link href={abusePageHref(row.original)} className="fr-link fr-link--sm" title="Voir les IP de ce canal (contrôle des abus)">
              {row.original.distinctIp}
            </Link>
          ) : (
            <span className="text-(--text-mention-grey)">0</span>
          ),
        header: 'IP uniques',
        id: 'distinctIp',
        width: '100px',
      },
      // Colonnes masquées : compteurs/taux/drills du funnel, gardés comme colonnes pour rester triables
      // génériquement (piste C : tri externe via le SortingState) et exportés à plat (exportOnly).
      {
        accessorFn: (row) => row.displays,
        exportHeader: 'Affichages',
        exportOnly: true,
        header: 'Affichages',
        id: 'displays',
        visible: false,
      },
      { accessorFn: (row) => row.tests, exportHeader: 'Tests', exportOnly: true, header: 'Tests', id: 'tests', visible: false },
      { accessorFn: (row) => row.demands, exportHeader: 'Demandes', exportOnly: true, header: 'Demandes', id: 'demands', visible: false },
      {
        accessorFn: (row) => row.testsEligible,
        exportHeader: 'Tests éligibles',
        exportOnly: true,
        header: 'Tests éligibles',
        id: 'testsEligible',
        visible: false,
      },
      {
        accessorFn: (row) => row.testRate ?? undefined,
        exportFn: (row) => formatRateForExport(row.testRate),
        exportHeader: 'Aff.→Test',
        exportOnly: true,
        header: 'Aff.→Test',
        id: 'testRate',
        sortUndefined: 'last',
        visible: false,
      },
      {
        accessorFn: (row) => row.demandsEligible,
        exportHeader: 'Demandes éligibles',
        exportOnly: true,
        header: 'Demandes éligibles',
        id: 'demandsEligible',
        visible: false,
      },
      {
        accessorFn: (row) => row.demandRate ?? undefined,
        exportFn: (row) => formatRateForExport(row.demandRate),
        exportHeader: 'Test→Dem.',
        exportOnly: true,
        header: 'Test→Dem.',
        id: 'demandRate',
        sortUndefined: 'last',
        visible: false,
      },
      {
        accessorFn: (row) => row.page ?? undefined,
        exportHeader: 'Page FCU',
        exportOnly: groupByPage,
        header: 'Page FCU',
        id: 'page',
        sortUndefined: 'last',
        visible: false,
      },
      {
        accessorFn: (row) => row.host ?? undefined,
        exportHeader: 'Site hôte',
        exportOnly: groupByHost,
        header: 'Site hôte',
        id: 'host',
        sortUndefined: 'last',
        visible: false,
      },
      {
        accessorFn: (row) => (row.sourceCreatedAt ? formatFrenchDate(new Date(row.sourceCreatedAt)) : undefined),
        exportHeader: 'Créée le',
        exportOnly: showCreatedAt,
        header: 'Créée le',
        id: 'sourceCreatedAt',
        sortUndefined: 'last',
        visible: false,
      },
    ],
    [groupByPage, groupByHost, showCreatedAt]
  );

  return (
    <SimplePage
      title="Conversion par source"
      description="Funnel affichages → tests → demandes, toutes sources"
      mode="authenticated"
      layout="center"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h1" color="blue-france" className="mb-0">
          Conversion par source
        </Heading>
        <Link href="/admin/conversion/abus" className="fr-link fr-link--icon-right fr-icon-arrow-right-line">
          Contrôle des abus
        </Link>
      </div>

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
          label="Granularité"
          className="mb-0"
          nativeSelectProps={{
            onChange: (event) => setFilters({ granularity: event.target.value as ConversionStatsGranularity }),
            value: granularity,
          }}
          options={[
            { label: 'Mensuel', value: 'month' },
            { label: 'Journalier', value: 'day' },
          ]}
        />
        <Select
          label="Canal"
          className="mb-0"
          nativeSelectProps={{
            onChange: (event) => setFilters({ channel: (event.target.value || null) as ConversionChannel | null }),
            value: channel ?? '',
          }}
          options={[
            { label: 'Toutes', value: '' },
            { label: 'Pages internes', value: 'internal' },
            { label: 'Iframes', value: 'iframe' },
          ]}
        />
        <Select
          label="Source"
          className="mb-0"
          nativeSelectProps={{ onChange: (event) => setFilters({ source: event.target.value || null }), value: source ?? '' }}
          options={sourceOptions}
        />
        <Checkbox
          label="Détailler par page FCU"
          nativeInputProps={{
            checked: groupByPage,
            name: 'groupByPage',
            onChange: (event) => setFilters({ groupByPage: event.target.checked }),
          }}
        />
        <Checkbox
          label="Détailler par site hôte"
          nativeInputProps={{
            checked: groupByHost,
            name: 'groupByHost',
            onChange: (event) => setFilters({ groupByHost: event.target.checked }),
          }}
        />
        <Checkbox
          label="Afficher la date de création"
          nativeInputProps={{
            checked: showCreatedAt,
            name: 'showCreatedAt',
            onChange: (event) => setFilters({ showCreatedAt: event.target.checked }),
          }}
        />
      </div>

      <TableSimple
        columns={columns}
        data={rows}
        controlsLayout="block"
        enableSortDialog
        loading={isLoading}
        loadingEmptyMessage="Aucune donnée sur cette période."
        padding="sm"
        export={{ fileName: `conversion_${dateFrom}_${dateTo}.xlsx`, sheetName: 'Conversion' }}
        urlSyncKey="conversion"
      />
    </SimplePage>
  );
};

export default ConversionStatsPage;
