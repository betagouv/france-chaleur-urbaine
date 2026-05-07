import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

import { MAX_PERMISSIONS_PER_USER, type Permission } from '../types';

const parseSncuList = (raw: string): string[] => [
  ...new Set(
    raw
      .split('\n')
      .map((line) => line.trim().toUpperCase())
      .filter(Boolean)
  ),
];

type LineStatus = 'found' | 'already_added' | 'not_found' | 'pending';

type LineRow = {
  input: string;
  status: LineStatus;
  label: string;
  permission?: Permission;
};

const statusIcon: Record<LineStatus, { className: string; color: string; label: string }> = {
  already_added: { className: 'fr-icon-information-line', color: 'text-blue-700', label: 'Déjà dans la liste' },
  found: { className: 'fr-icon-check-line', color: 'text-success', label: 'Réseau trouvé' },
  not_found: { className: 'fr-icon-close-circle-line', color: 'text-destructive', label: 'Aucun réseau trouvé' },
  pending: { className: 'fr-icon-refresh-line', color: 'text-faded', label: 'Vérification en cours' },
};

type BulkAddNetworksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPermissions: Permission[];
  onAdd: (permissions: Permission[]) => void;
};

/**
 * Modale d'ajout en masse de permissions réseau via une liste d'IDs SNCU collée.
 * Preview live (debounce) avec statut par ligne, ajoute uniquement les réseaux trouvés non déjà présents.
 */
const BulkAddNetworksDialog = ({ open, onOpenChange, existingPermissions, onAdd }: BulkAddNetworksDialogProps) => {
  const [raw, setRaw] = useState('');
  const [debounced, setDebounced] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setRaw('');
      setDebounced('');
    }
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw), 300);
    return () => clearTimeout(id);
  }, [raw]);

  const sncuIds = useMemo(() => parseSncuList(debounced), [debounced]);

  const existingKeys = useMemo(
    () => new Set(existingPermissions.filter((p) => p.type === 'reseau_de_chaleur').map((p) => p.resource_id)),
    [existingPermissions]
  );

  const lookup = trpc.permissions.admin.findReseauxDeChaleurBySncuIds.useQuery(
    { sncuIds },
    { enabled: sncuIds.length > 0, staleTime: 60_000 }
  );

  const rows: LineRow[] = useMemo(() => {
    if (sncuIds.length === 0) return [];
    if (!lookup.data) {
      return sncuIds.map((input) => ({ input, label: 'Vérification…', status: 'pending' }));
    }
    const byInput = new Map(lookup.data.map((r) => [r.input, r]));
    return sncuIds.map((input): LineRow => {
      const result = byInput.get(input);
      if (!result || result.status === 'not_found') {
        return { input, label: 'Aucun réseau trouvé', status: 'not_found' };
      }
      const network = result.network!;
      const permission: Permission = { resource_id: String(network.idFcu), type: 'reseau_de_chaleur' };
      const labelBase = network.gestionnaire ? `${network.name} (${network.gestionnaire})` : network.name;
      if (existingKeys.has(permission.resource_id)) {
        return { input, label: labelBase, permission, status: 'already_added' };
      }
      return { input, label: labelBase, permission, status: 'found' };
    });
  }, [sncuIds, lookup.data, existingKeys]);

  const newPermissions = useMemo(() => rows.filter((r) => r.status === 'found' && r.permission).map((r) => r.permission!), [rows]);
  const counts = useMemo(
    () => ({
      already: rows.filter((r) => r.status === 'already_added').length,
      found: rows.filter((r) => r.status === 'found').length,
      notFound: rows.filter((r) => r.status === 'not_found').length,
    }),
    [rows]
  );

  const willExceedLimit = existingPermissions.length + newPermissions.length > MAX_PERMISSIONS_PER_USER;
  const remainingSlots = MAX_PERMISSIONS_PER_USER - existingPermissions.length;

  const handleSubmit = () => {
    if (newPermissions.length === 0 || willExceedLimit) return;
    onAdd(newPermissions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Ajout en masse par ID SNCU" size="lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="bulk-sncu-textarea" className="fr-label">
            Liste d'IDs SNCU
            <span className="fr-hint-text">Un ID par ligne (ex : 1101C). La casse n'est pas prise en compte.</span>
          </label>
          <textarea
            id="bulk-sncu-textarea"
            className="fr-input"
            rows={8}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'1101C\n1102C\n1103C'}
          />
        </div>

        {sncuIds.length > 0 && (
          <div className="border border-gray-200 rounded">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 w-10" />
                    <th className="text-left px-3 py-2 w-32">ID SNCU</th>
                    <th className="text-left px-3 py-2">Réseau</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const meta = statusIcon[row.status];
                    return (
                      <tr key={row.input} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <span className={cx(meta.className, meta.color)} aria-label={meta.label} title={meta.label} />
                        </td>
                        <td className="px-3 py-2 font-mono">{row.input}</td>
                        <td className="px-3 py-2">{row.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-faded">
            {sncuIds.length === 0 ? (
              <>Collez une liste d'IDs SNCU pour démarrer la vérification.</>
            ) : lookup.isFetching ? (
              <>Vérification…</>
            ) : (
              <>
                <strong>{counts.found}</strong> à ajouter · {counts.already} déjà présent{counts.already > 1 ? 's' : ''} · {counts.notFound}{' '}
                introuvable{counts.notFound > 1 ? 's' : ''}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button priority="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={newPermissions.length === 0 || willExceedLimit || lookup.isFetching}>
              Ajouter {newPermissions.length > 0 ? `${newPermissions.length} réseau${newPermissions.length > 1 ? 'x' : ''}` : ''}
            </Button>
          </div>
        </div>

        {willExceedLimit && (
          <p className="text-sm text-destructive">
            Limite de {MAX_PERMISSIONS_PER_USER} permissions dépassée. Encore {Math.max(0, remainingSlots)} place
            {remainingSlots > 1 ? 's' : ''} disponible{remainingSlots > 1 ? 's' : ''}.
          </p>
        )}
      </div>
    </Dialog>
  );
};

export default BulkAddNetworksDialog;
