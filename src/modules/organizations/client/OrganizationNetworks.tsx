import { useState } from 'react';

import Button from '@/components/ui/Button';
import { notify } from '@/modules/notification';
import { permissionTypeBadgeColors, permissionTypeLabels } from '@/modules/permissions/constants';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

const OrganizationNetworks = ({ organizationId }: { organizationId: string }) => {
  const utils = trpc.useUtils();
  const { data: networks, isLoading } = trpc.organizations.admin.networks.list.useQuery({ organizationId });
  const { data: drift } = trpc.organizations.admin.networks.drift.useQuery({ organizationId });
  const patterns = drift?.patterns ?? [];

  const [newPattern, setNewPattern] = useState('');
  const trimmed = newPattern.trim();
  const preview = trpc.organizations.admin.networks.previewPattern.useQuery({ pattern: trimmed }, { enabled: trimmed.length >= 2 });

  const invalidate = () => {
    void utils.organizations.admin.networks.list.invalidate({ organizationId });
    void utils.organizations.admin.networks.drift.invalidate({ organizationId });
    void utils.organizations.admin.list.invalidate();
  };

  const setPatterns = trpc.organizations.admin.networks.setPatterns.useMutation({ onSuccess: invalidate });
  const refresh = trpc.organizations.admin.networks.refresh.useMutation({
    onSuccess: (count) => {
      invalidate();
      notify('success', `${count} réseau(x) rattaché(s)`);
    },
  });
  const detach = trpc.organizations.admin.networks.detach.useMutation({ onSuccess: invalidate });
  const detachAll = trpc.organizations.admin.networks.detachAll.useMutation({
    onSuccess: (count) => {
      invalidate();
      notify('success', `${count} réseau(x) détaché(s)`);
    },
  });

  const addPattern = () => {
    if (trimmed.length < 2 || patterns.includes(trimmed)) return;
    setPatterns.mutate({ organizationId, patterns: [...patterns, trimmed] });
    setNewPattern('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Motifs gestionnaire (insensible à la casse)</p>
        {patterns.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {patterns.map((p) => (
              <li key={p} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm">
                <span>{p}</span>
                <button
                  type="button"
                  className="text-faded"
                  aria-label={`Retirer ${p}`}
                  disabled={setPatterns.isPending}
                  onClick={() => setPatterns.mutate({ organizationId, patterns: patterns.filter((x) => x !== p) })}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-faded">Aucun motif déclaré.</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="fr-input"
            placeholder="motif, ex: %engie%"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPattern();
              }
            }}
          />
          <Button
            type="button"
            size="small"
            priority="secondary"
            disabled={trimmed.length < 2 || patterns.includes(trimmed) || setPatterns.isPending}
            onClick={addPattern}
          >
            Ajouter
          </Button>
        </div>
        {trimmed.length >= 2 && (
          <p className="text-xs text-faded">
            {preview.isLoading
              ? 'Calcul…'
              : `${preview.data?.attachable ?? 0} réseau(x) rattachable(s)${
                  preview.data && preview.data.total !== preview.data.attachable ? ` (${preview.data.total} correspondent au motif)` : ''
                }`}
          </p>
        )}
      </div>

      {drift && (drift.unattachedCount > 0 || drift.attachedUnmatchedCount > 0) && (
        <div className="space-y-2 rounded bg-gray-100 p-3 text-sm">
          {drift.unattachedCount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span>{drift.unattachedCount} réseau(x) correspondent à un motif mais ne sont pas rattachés.</span>
              <Button
                type="button"
                size="small"
                priority="primary"
                iconId="ri-links-line"
                disabled={refresh.isPending}
                onClick={() => refresh.mutate({ organizationId })}
              >
                Rattacher
              </Button>
            </div>
          )}
          {drift.attachedUnmatchedCount > 0 && (
            <p className="mb-0">⚠️ {drift.attachedUnmatchedCount} réseau(x) rattachés ne correspondent à aucun motif (à vérifier).</p>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-faded">Chargement…</p>
      ) : networks && networks.length > 0 ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="mb-0 text-sm font-medium">Réseaux rattachés ({networks.length})</p>
            <Button
              type="button"
              size="small"
              priority="tertiary"
              iconId="ri-link-unlink"
              disabled={detachAll.isPending}
              onClick={() => {
                if (window.confirm(`Détacher les ${networks.length} réseau(x) de cette organisation ?`)) {
                  detachAll.mutate({ organizationId });
                }
              }}
            >
              Tout détacher
            </Button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {networks.map((network) => (
              <li
                key={`${network.type}-${network.id_fcu}`}
                className="flex items-center justify-between gap-2 rounded border border-gray-200 px-3 py-1.5"
              >
                <div className="min-w-0 text-sm">
                  <div className="truncate">{network.nom_reseau ?? `Réseau #${network.id_fcu}`}</div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-faded">
                    <span className={cx('rounded px-1.5 py-0.5 font-medium', permissionTypeBadgeColors[network.type])}>
                      {permissionTypeLabels[network.type]}
                    </span>
                    {network.gestionnaire ? <span className="truncate">· {network.gestionnaire}</span> : null}
                  </div>
                </div>
                <Button
                  type="button"
                  size="small"
                  priority="tertiary"
                  iconId="ri-link-unlink"
                  disabled={detach.isPending}
                  onClick={() => detach.mutate({ idFcu: network.id_fcu, type: network.type })}
                >
                  Détacher
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-faded">
          Aucun réseau rattaché. Déclarez un motif gestionnaire puis rattachez les réseaux correspondants.
        </p>
      )}
    </div>
  );
};

export default OrganizationNetworks;
