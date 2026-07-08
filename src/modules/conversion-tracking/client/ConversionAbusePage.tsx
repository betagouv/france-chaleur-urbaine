import Badge from '@codegouvfr/react-dsfr/Badge';
import { keepPreviousData } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useMemo, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { useDialogState } from '@/hooks/useDialogState';
import { CONVERSION_IP_RETENTION_DAYS, type ConversionIpDisposition } from '@/modules/conversion-tracking/constants';
import { notify } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { formatAsISODate, formatFrenchDate } from '@/utils/date';

type SuspiciousRow = RouterOutput['conversionTracking']['getSuspiciousIps'][number];
type RuleRow = RouterOutput['conversionTracking']['ipRules']['list'][number];

const today = new Date();
const defaultTo = formatAsISODate(today);
const defaultFrom = formatAsISODate(new Date(today.getTime() - CONVERSION_IP_RETENTION_DAYS * 24 * 3600 * 1000));

const ratio = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)}×`);
/** Retire le préfixe hôte (`/32`, `/128`) pour les liens d'investigation d'un hôte unique. */
const bareHost = (ip: string) => ip.replace(/\/(?:32|128)$/, '');

const dispositionBadge: Record<ConversionIpDisposition, { label: string; severity: 'error' | 'info' }> = {
  exclude: { label: 'exclue', severity: 'error' },
  keep: { label: 'conservée', severity: 'info' },
};

/** Bouton-icône (globe) vers ipinfo.io (pays, ASN / hébergeur) — ouvre un onglet, à côté de l'IP. */
const IpLink = ({ ip }: { ip: string }) => (
  <Button
    priority="tertiary no outline"
    size="small"
    iconId="fr-icon-earth-line"
    title={`Voir ${ip} sur ipinfo.io`}
    href={`https://ipinfo.io/${bareHost(ip)}`}
  />
);

const filtersParsers = {
  dateFrom: parseAsString.withDefault(defaultFrom),
  dateTo: parseAsString.withDefault(defaultTo),
  host: parseAsString,
  minTests: parseAsInteger.withDefault(50),
  route: parseAsString,
  source: parseAsString,
};

const ConversionAbusePage = () => {
  const utils = trpc.useUtils();
  const [{ dateFrom, dateTo, host, minTests, route, source }, setFilters] = useQueryStates(filtersParsers);

  const ruleDialog = useDialogState<{ ip: string; disposition: ConversionIpDisposition }>();
  const removeDialog = useDialogState<{ ip: string }>();
  const [reason, setReason] = useState('');

  const scopeActive = Boolean(source || route || host);
  const { data: rows = [], isLoading } = trpc.conversionTracking.getSuspiciousIps.useQuery(
    {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(`${dateTo}T23:59:59`),
      host: host || undefined,
      limit: 200,
      // Source/route/host ciblés → toutes les IP (même faible volume) pour identifier l'origine.
      minTests: scopeActive ? 0 : minTests,
      route: route || undefined,
      source: source || undefined,
    },
    { placeholderData: keepPreviousData }
  );
  const { data: rules = [], isLoading: loadingRules } = trpc.conversionTracking.ipRules.list.useQuery();
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

  const invalidate = () => {
    void utils.conversionTracking.getSuspiciousIps.invalidate();
    void utils.conversionTracking.ipRules.list.invalidate();
    void utils.conversionTracking.getStats.invalidate();
  };
  const upsertMutation = trpc.conversionTracking.ipRules.upsert.useMutation({ onSuccess: invalidate });
  const removeMutation = trpc.conversionTracking.ipRules.remove.useMutation({ onSuccess: invalidate });

  const openRule = (ip: string, disposition: ConversionIpDisposition) => {
    setReason('');
    ruleDialog.open({ disposition, ip });
  };
  // ConfirmDialog ne ferme que sur succès ; les erreurs tRPC sont notifiées globalement (errorHandlerLink).
  const confirmRule = async () => {
    const data = ruleDialog.data;
    if (!data) return;
    const result = await upsertMutation.mutateAsync({ ...data, reason: reason.trim() });
    notify('success', `Règle « ${result.disposition} » enregistrée pour ${result.ip} — ${result.changedEvents} événement(s) recomptés.`);
  };
  const confirmRemove = async () => {
    const target = removeDialog.data;
    if (!target) return;
    const result = await removeMutation.mutateAsync({ ip: target.ip });
    notify('success', `Règle retirée pour ${result.ip} — ${result.changedEvents} événement(s) recomptés.`);
  };

  const suspiciousColumns: ColumnDef<SuspiciousRow>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.ip,
        cell: ({ row }) => (
          <span className="flex items-center gap-1">
            <span className="font-mono whitespace-nowrap">{row.original.ip}</span>
            <IpLink ip={row.original.ip} />
          </span>
        ),
        flex: 2,
        header: 'IP',
        id: 'ip',
      },
      {
        accessorFn: (row) => row.tests,
        align: 'right',
        cell: ({ row }) => <span className="font-bold">{row.original.tests}</span>,
        header: 'Tests',
        id: 'tests',
        width: '80px',
      },
      {
        accessorFn: (row) => row.testPerDisplay ?? undefined,
        align: 'right',
        cell: ({ row }) => ratio(row.original.testPerDisplay),
        header: 'Test/Aff.',
        id: 'ratio',
        sortUndefined: 'last',
        width: '86px',
      },
      { accessorFn: (row) => row.distinctRoutes, align: 'right', header: 'Routes', id: 'routes', width: '68px' },
      { accessorFn: (row) => row.distinctDays, align: 'right', header: 'Jours', id: 'days', width: '58px' },
      { accessorFn: (row) => row.demands, align: 'right', header: 'Demandes', id: 'demands', width: '92px' },
      {
        accessorFn: (row) => row.lastSeen,
        cell: ({ row }) => {
          const first = formatFrenchDate(new Date(row.original.firstSeen));
          const last = formatFrenchDate(new Date(row.original.lastSeen));
          return <span className="whitespace-nowrap text-(--text-mention-grey)">{first === last ? first : `${first} → ${last}`}</span>;
        },
        header: 'Vue',
        id: 'seen',
        width: '200px',
      },
      {
        accessorFn: (row) => row.ruleDisposition ?? '',
        cell: ({ row }) => {
          const { ruleDisposition, ruleReason } = row.original;
          if (!ruleDisposition) return <span className="text-(--text-mention-grey)">—</span>;
          const badge = dispositionBadge[ruleDisposition];
          return (
            <span title={ruleReason ?? undefined}>
              <Badge severity={badge.severity} small noIcon>
                {badge.label}
              </Badge>
            </span>
          );
        },
        header: 'Statut',
        id: 'status',
        width: '92px',
      },
      {
        cell: ({ row }) => {
          const { ip, ruleDisposition } = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {ruleDisposition !== 'exclude' && (
                <Button
                  size="small"
                  priority="secondary"
                  variant="destructive"
                  iconId="fr-icon-close-circle-line"
                  onClick={() => openRule(ip, 'exclude')}
                >
                  Bannir
                </Button>
              )}
              {ruleDisposition !== 'keep' && (
                <Button
                  size="small"
                  priority="secondary"
                  variant="success"
                  iconId="fr-icon-checkbox-circle-line"
                  onClick={() => openRule(ip, 'keep')}
                >
                  Conserver
                </Button>
              )}
              {ruleDisposition && (
                <Button size="small" priority="tertiary" iconId="fr-icon-delete-line" onClick={() => removeDialog.open({ ip })}>
                  Retirer
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        header: 'Actions',
        id: 'actions',
        width: '230px',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const ruleColumns: ColumnDef<RuleRow>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.ip,
        cell: ({ row }) => (
          <span className="flex items-center gap-1">
            <span className="font-mono whitespace-nowrap">{row.original.ip}</span>
            <IpLink ip={row.original.ip} />
          </span>
        ),
        flex: 1,
        header: 'IP / plage',
        id: 'ip',
      },
      {
        accessorFn: (row) => row.disposition,
        cell: ({ row }) => {
          const badge = dispositionBadge[row.original.disposition];
          return (
            <Badge severity={badge.severity} small noIcon>
              {badge.label}
            </Badge>
          );
        },
        header: 'Disposition',
        id: 'disposition',
        width: '120px',
      },
      {
        accessorFn: (row) => row.reason,
        cell: ({ row }) => <span className="break-all">{row.original.reason}</span>,
        flex: 2,
        header: 'Motif',
        id: 'reason',
      },
      {
        accessorFn: (row) => row.created_at,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-(--text-mention-grey)">{formatFrenchDate(new Date(row.original.created_at))}</span>
        ),
        header: 'Ajoutée le',
        id: 'created_at',
        width: '130px',
      },
      {
        accessorFn: (row) => row.createdByEmail ?? undefined,
        cell: ({ row }) => <span className="break-all text-(--text-mention-grey)">{row.original.createdByEmail ?? '—'}</span>,
        flex: 1,
        header: 'Par',
        id: 'createdByEmail',
        sortUndefined: 'last',
      },
      {
        cell: ({ row }) => (
          <Button size="small" priority="tertiary" iconId="fr-icon-delete-line" onClick={() => removeDialog.open({ ip: row.original.ip })}>
            Retirer
          </Button>
        ),
        enableSorting: false,
        header: 'Actions',
        id: 'actions',
        width: '110px',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const dialogData = ruleDialog.data;
  const isExclude = dialogData?.disposition === 'exclude';

  return (
    <SimplePage
      title="Contrôle des abus"
      description="Détection et bannissement des IP polluant les stats de conversion"
      mode="authenticated"
      layout="center"
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-1">
        <Heading as="h1" color="blue-france" className="mb-0">
          Contrôle des abus
        </Heading>
        <Link href="/admin/conversion" className="fr-link self-start">
          ← Conversion par source
        </Link>
      </div>

      <p className="fr-hint-text mb-0">
        Les IP sont conservées {CONVERSION_IP_RETENTION_DAYS} jours (purge RGPD) : la détection et le bannissement ne portent que sur cette
        fenêtre ; au-delà, les statistiques sont figées et ne peuvent plus être corrigées.
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
          label="Source"
          className="mb-0"
          nativeSelectProps={{ onChange: (event) => setFilters({ source: event.target.value || null }), value: source ?? '' }}
          options={sourceOptions}
        />
        <Input
          label="Route"
          className="mb-0"
          nativeInputProps={{
            onChange: (event) => setFilters({ route: event.target.value || null }),
            placeholder: '/villes/[ville]',
            value: route ?? '',
          }}
        />
        <Input
          label="Site hôte"
          className="mb-0"
          nativeInputProps={{
            onChange: (event) => setFilters({ host: event.target.value || null }),
            placeholder: 'exemple.fr',
            value: host ?? '',
          }}
        />
        <Input
          label="Tests min."
          className="mb-0"
          disabled={scopeActive}
          hintText={scopeActive ? 'Toutes les IP (source ciblée)' : undefined}
          nativeInputProps={{
            min: 0,
            onChange: (event) => setFilters({ minTests: Number(event.target.value) || 0 }),
            type: 'number',
            value: scopeActive ? 0 : minTests,
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Heading as="h2" color="blue-france" className="mb-0">
          IP suspectes
        </Heading>
        <p className="fr-hint-text mb-0">
          Un ratio Test/Affichage élevé, une seule route et 0 demande signalent un robot. « Bannir » retire des statistiques les événements
          de l'IP des {CONVERSION_IP_RETENTION_DAYS} derniers jours ; « Conserver » marque une IP légitime connue (elle ne sera plus
          proposée au bannissement). Le globe ouvre le détail de l'IP (pays, hébergeur/ASN) sur ipinfo.io.
        </p>
        <TableSimple
          columns={suspiciousColumns}
          data={rows}
          rowIdKey="ip"
          controlsLayout="block"
          loading={isLoading}
          loadingEmptyMessage="Aucune IP suspecte sur ces critères."
          padding="sm"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Heading as="h2" className="mb-0">
          Règles ({rules.length})
        </Heading>
        <TableSimple
          columns={ruleColumns}
          data={rules}
          rowIdKey="ip"
          controlsLayout="block"
          loading={loadingRules}
          loadingEmptyMessage="Aucune règle définie."
          padding="sm"
        />
      </div>

      <ConfirmDialog
        control={ruleDialog}
        size="md"
        title={isExclude ? `Bannir ${dialogData?.ip}` : `Conserver ${dialogData?.ip}`}
        confirmLabel={isExclude ? 'Bannir' : 'Conserver'}
        confirmIconId={isExclude ? 'fr-icon-close-circle-line' : 'fr-icon-checkbox-circle-line'}
        danger={isExclude}
        confirmDisabled={!reason.trim()}
        onConfirm={confirmRule}
      >
        <Input
          label="Motif"
          nativeInputProps={{ autoFocus: true, onChange: (event) => setReason(event.target.value), required: true, value: reason }}
        />
      </ConfirmDialog>

      <ConfirmDialog
        control={removeDialog}
        size="md"
        title={`Retirer la règle sur ${removeDialog.data?.ip}`}
        confirmLabel="Retirer"
        onConfirm={confirmRemove}
      >
        <p className="mb-0">
          Les événements de cette IP redeviendront comptés dans les statistiques, sauf s'ils restent couverts par une autre règle « exclude
          ».
        </p>
      </ConfirmDialog>
    </SimplePage>
  );
};

export default ConversionAbusePage;
