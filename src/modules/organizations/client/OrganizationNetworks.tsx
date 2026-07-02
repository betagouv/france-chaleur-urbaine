import { useState } from 'react';

import Button from '@/components/ui/Button';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

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

  const addPattern = () => {
    if (trimmed.length < 2 || patterns.includes(trimmed)) return;
    setPatterns.mutate({ organizationId, patterns: [...patterns, trimmed] });
    setNewPattern('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Motifs gestionnaire (ILIKE)</p>
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
            {preview.isLoading ? 'Calcul…' : `${preview.data ?? 0} réseau(x) de chaleur correspondent à ce motif`}
          </p>
        )}
      </div>

      {drift && (drift.unattachedCount > 0 || drift.attachedUnmatchedCount > 0) && (
        <div className="space-y-2 rounded bg-gray-100 p-3 text-sm">
          {drift.unattachedCount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span>{drift.unattachedCount} réseau(x) matchent un motif mais ne sont pas rattachés.</span>
              <Button
                type="button"
                size="small"
                priority="secondary"
                disabled={refresh.isPending}
                onClick={() => refresh.mutate({ organizationId })}
              >
                Rafraîchir
              </Button>
            </div>
          )}
          {drift.attachedUnmatchedCount > 0 && (
            <p>⚠️ {drift.attachedUnmatchedCount} réseau(x) rattachés ne matchent aucun motif (à vérifier).</p>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-faded">Chargement…</p>
      ) : networks && networks.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {networks.map((network) => (
            <li key={network.id_fcu} className="flex items-center justify-between rounded border border-gray-200 px-3 py-1.5">
              <div className="text-sm">
                {network.nom_reseau ?? `Réseau #${network.id_fcu}`}
                <span className="ml-2 text-xs text-faded">{network.Gestionnaire ?? ''}</span>
              </div>
              <Button
                type="button"
                size="small"
                priority="tertiary"
                disabled={detach.isPending}
                onClick={() => detach.mutate({ idFcu: network.id_fcu })}
              >
                Détacher
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-faded">Aucun réseau rattaché. Déclarez un motif gestionnaire puis Rafraîchir.</p>
      )}
    </div>
  );
};

export default OrganizationNetworks;
