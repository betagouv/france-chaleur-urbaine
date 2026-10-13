import { useState } from 'react';

import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import OrganizationNetworkList, { type OrganizationNetworkListItem } from './OrganizationNetworkList';

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
  const attach = trpc.organizations.admin.networks.attach.useMutation({ onSuccess: invalidate });
  const detach = trpc.organizations.admin.networks.detach.useMutation({ onSuccess: invalidate });
  const detachAll = trpc.organizations.admin.networks.detachAll.useMutation({
    onSuccess: (count) => {
      invalidate();
      notify('success', `${count} réseau(x) détaché(s)`);
    },
  });
  const detachUnmatched = trpc.organizations.admin.networks.detachUnmatched.useMutation({
    onSuccess: (count) => {
      invalidate();
      notify('success', `${count} réseau(x) détaché(s)`);
    },
  });
  const detachAction = {
    disabled: detach.isPending,
    iconId: 'ri-link-unlink' as const,
    label: 'Détacher',
    onClick: (network: OrganizationNetworkListItem) => detach.mutate({ idFcu: network.id_fcu, type: network.type }),
  };

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

      {drift && drift.unattachedMatching.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="mb-0 text-sm font-medium">Réseaux à rattacher ({drift.unattachedMatching.length})</p>
            <Button
              type="button"
              size="small"
              priority="primary"
              iconId="ri-links-line"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate({ organizationId })}
            >
              Tout rattacher
            </Button>
          </div>
          <OrganizationNetworkList
            networks={drift.unattachedMatching}
            action={{
              disabled: attach.isPending,
              iconId: 'ri-links-line',
              label: 'Rattacher',
              onClick: (network) => attach.mutate({ idFcu: network.id_fcu, organizationId, type: network.type }),
            }}
          />
        </div>
      )}

      {drift && drift.attachedUnmatched.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="mb-0 flex items-center gap-1 text-sm font-medium">
              <Icon name="fr-icon-warning-line" size="sm" color="warning" />À détacher ou vérifier ({drift.attachedUnmatched.length})
            </p>
            <Button
              type="button"
              size="small"
              priority="secondary"
              iconId="ri-link-unlink"
              disabled={detachUnmatched.isPending}
              onClick={() => detachUnmatched.mutate({ organizationId })}
            >
              Tout détacher
            </Button>
          </div>
          <OrganizationNetworkList networks={drift.attachedUnmatched} action={detachAction} />
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
          <OrganizationNetworkList networks={networks} action={detachAction} />
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
