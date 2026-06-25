import Badge from '@codegouvfr/react-dsfr/Badge';
import { keepPreviousData } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import Checkbox from '@/components/form/dsfr/Checkbox';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import {
  type ConversionChannel,
  type ConversionStatsGranularity,
  conversionChannels,
  conversionStatsGranularities,
} from '@/modules/conversion-tracking/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { formatFrenchDate } from '@/utils/date';

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const today = new Date();
const defaultTo = isoDay(today);
const defaultFrom = isoDay(new Date(today.getFullYear(), today.getMonth() - 11, 1));

const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);
const pctExport = (value: number | null) => (value === null ? '' : `${Math.round(value * 100)}%`);
const channelLabel: Record<ConversionChannel, string> = { iframe: 'Iframe', internal: 'Interne' };

type StatRow = RouterOutput['conversionTracking']['getStats'][number];

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
        cell: ({ row }) => (
          <span className="break-all">
            {row.original.label}
            {row.original.unregistered && (
              <span title="Intégration reçue mais absente du registre des intégrations">
                <Badge severity="warning" small noIcon className="fr-ml-1w">
                  hors registre
                </Badge>
              </span>
            )}
          </span>
        ),
        flex: 2,
        header: 'Intégration / route',
        id: 'label',
      },
      {
        accessorFn: (row) => (row.sourceCreatedAt ? formatFrenchDate(new Date(row.sourceCreatedAt)) : undefined),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-(--text-mention-grey)">
            {row.original.sourceCreatedAt ? formatFrenchDate(new Date(row.original.sourceCreatedAt)) : '—'}
          </span>
        ),
        header: 'Créée le',
        id: 'sourceCreatedAt',
        sortUndefined: 'last',
        visible: showCreatedAt,
        width: '110px',
      },
      {
        accessorFn: (row) => row.page ?? undefined,
        cell: ({ row }) => <span className="break-all text-(--text-mention-grey)">{row.original.page ?? '—'}</span>,
        flex: 2,
        header: 'Page FCU',
        id: 'page',
        sortUndefined: 'last',
        visible: groupByPage,
      },
      {
        accessorFn: (row) => row.host ?? undefined,
        cell: ({ row }) => <span className="break-all text-(--text-mention-grey)">{row.original.host ?? '—'}</span>,
        flex: 2,
        header: 'Site hôte',
        id: 'host',
        sortUndefined: 'last',
        visible: groupByHost,
      },
      {
        accessorFn: (row) => row.period ?? undefined,
        cell: ({ row }) => <span className="whitespace-nowrap">{row.original.period ?? '—'}</span>,
        header: 'Période',
        id: 'period',
        sortUndefined: 'last',
        width: '110px',
      },
      { accessorFn: (row) => row.displays, align: 'right', header: 'Affichages', id: 'displays', width: '100px' },
      { accessorFn: (row) => row.tests, align: 'right', header: 'Tests', id: 'tests', width: '80px' },
      {
        accessorFn: (row) => row.testsEligible,
        align: 'right',
        exportHeader: 'Tests éligibles',
        header: 'dont éligibles',
        id: 'testsEligible',
        width: '120px',
      },
      {
        accessorFn: (row) => row.demands,
        align: 'right',
        cell: ({ row }) => <span className="font-bold">{row.original.demands}</span>,
        header: 'Demandes',
        id: 'demands',
        width: '100px',
      },
      {
        accessorFn: (row) => row.demandsEligible,
        align: 'right',
        exportHeader: 'Demandes éligibles',
        header: 'dont éligibles',
        id: 'demandsEligible',
        width: '130px',
      },
      {
        accessorFn: (row) => row.distinctIp,
        align: 'right',
        cell: ({ row }) => <span className="text-(--text-mention-grey)">{row.original.distinctIp}</span>,
        header: 'IP uniques',
        id: 'distinctIp',
        width: '100px',
      },
      {
        accessorFn: (row) => row.testRate ?? undefined,
        align: 'right',
        cell: ({ row }) => pct(row.original.testRate),
        exportFn: (row) => pctExport(row.testRate),
        header: 'Aff.→Test',
        id: 'testRate',
        sortUndefined: 'last',
        width: '100px',
      },
      {
        accessorFn: (row) => row.demandRate ?? undefined,
        align: 'right',
        cell: ({ row }) => pct(row.original.demandRate),
        exportFn: (row) => pctExport(row.demandRate),
        header: 'Test→Dem.',
        id: 'demandRate',
        sortUndefined: 'last',
        width: '100px',
      },
    ],
    [groupByPage, groupByHost, showCreatedAt]
  );

  return (
    <SimplePage title="Conversion par source" description="Funnel affichages → tests → demandes, toutes sources" mode="authenticated">
      <div className="fr-container fr-py-4w flex flex-col gap-6">
        <Heading as="h1" color="blue-france" className="mb-0">
          Conversion par source
        </Heading>

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
          loading={isLoading}
          loadingEmptyMessage="Aucune donnée sur cette période."
          padding="sm"
          export={{ fileName: `conversion_${dateFrom}_${dateTo}.xlsx`, sheetName: 'Conversion' }}
          urlSyncKey="conversion"
        />
      </div>
    </SimplePage>
  );
};

export default ConversionStatsPage;
