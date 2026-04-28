import { skipToken } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ReseauAutocomplete from '@/modules/reseaux/client/ReseauAutocomplete';
import type { NetworkType } from '@/modules/reseaux/constants';
import type { NetworkSearchResult } from '@/modules/reseaux/server/service';
import trpc from '@/modules/trpc/client';

import AffectedNetwork from './AffectedNetwork';

export type NetworkSelection = {
  networkIdFcu: number | null;
  networkType: NetworkType | null;
  networkName: string | null;
  networkSncuId: string | null;
  distance: number | null;
};

type NetworkSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandId: string;
  currentNetworkId: number | null;
  currentNetworkType: NetworkType | null;
  isAdmin: boolean;
  onConfirm: (selection: NetworkSelection, comment: string | null) => Promise<void>;
};

type Mode = 'select' | 'unassign' | null;

/**
 * Dialog partagé pour réaffecter (choix d'un réseau) ou désaffecter une demande.
 * - admin (`isAdmin=true`) : applique directement le changement via `onConfirm`
 * - non-admin : ajoute un champ commentaire optionnel, `onConfirm` crée une demande de réaffectation
 */
export default function NetworkSelectorDialog({
  open,
  onOpenChange,
  demandId,
  currentNetworkId,
  currentNetworkType,
  isAdmin,
  onConfirm,
}: NetworkSelectorDialogProps) {
  const [selected, setSelected] = useState<NetworkSearchResult | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setMode(null);
      setComment('');
    }
  }, [open]);

  const { data: distance, isFetching: isFetchingDistance } = trpc.demands.gestionnaire.computeNetworkDistance.useQuery(
    mode === 'select' && selected ? { demandId, networkIdFcu: selected.id_fcu, networkType: selected.network_type } : skipToken
  );

  const hasCurrentAssignment = currentNetworkId !== null && currentNetworkType !== null;

  const handleConfirm = async () => {
    if (mode === 'select' && selected) {
      await onConfirm(
        {
          distance: distance ?? null,
          networkIdFcu: selected.id_fcu,
          networkName: selected.nom_reseau,
          networkSncuId: selected.identifiant_reseau,
          networkType: selected.network_type,
        },
        isAdmin ? null : comment.trim() || null
      );
    } else if (mode === 'unassign') {
      await onConfirm(
        { distance: null, networkIdFcu: null, networkName: null, networkSncuId: null, networkType: null },
        isAdmin ? null : comment.trim() || null
      );
    }
  };

  const title = isAdmin ? "Changer l'affectation du réseau" : 'Demander une réaffectation';
  const description = isAdmin
    ? 'Cette action remplacera immédiatement le réseau affecté à la demande.'
    : "Cette demande sera transmise à l'équipe FCU pour validation.";

  const isUnassign = mode === 'unassign';
  const hasChoice = (mode === 'select' && selected) || mode === 'unassign';

  const confirmLabel = isAdmin
    ? isUnassign
      ? 'Désaffecter'
      : 'Appliquer le changement'
    : isUnassign
      ? 'Envoyer la demande de désaffectation'
      : 'Envoyer la demande';

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="md">
      <div className="flex flex-col gap-3">
        {!hasChoice ? (
          <>
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="network-search">
                Rechercher un réseau
              </label>
              <ReseauAutocomplete
                id="network-search"
                excludeNetworkIdFcu={currentNetworkId}
                excludeNetworkType={currentNetworkType}
                onSelect={(result) => {
                  setSelected(result);
                  setMode('select');
                }}
              />
            </div>
            {hasCurrentAssignment && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ou</span>
                <Button priority="secondary" size="small" iconId="fr-icon-close-line" onClick={() => setMode('unassign')}>
                  Désaffecter le réseau
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="border rounded p-3">
              {isUnassign ? (
                <div className="text-sm">
                  <div className="font-semibold">Désaffectation du réseau</div>
                  <div className="text-gray-600 mt-1">La demande ne sera plus associée à aucun réseau.</div>
                </div>
              ) : selected ? (
                <>
                  <AffectedNetwork
                    networkName={selected.nom_reseau}
                    networkType={selected.network_type}
                    networkSncuId={selected.identifiant_reseau}
                    distance={distance}
                  />
                  {isFetchingDistance && <div className="mt-2 text-sm text-gray-500">Calcul de la distance...</div>}
                </>
              ) : null}
            </div>

            {!isAdmin && (
              <div className="fr-input-group">
                <label className="fr-label" htmlFor="network-change-comment">
                  Commentaire (optionnel)
                </label>
                <textarea
                  id="network-change-comment"
                  className="fr-input"
                  rows={3}
                  placeholder="Précisez le motif de la demande..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-between gap-2">
          <Button
            priority="tertiary"
            onClick={() => {
              if (hasChoice) {
                setSelected(null);
                setMode(null);
              } else {
                onOpenChange(false);
              }
            }}
          >
            {hasChoice ? 'Retour' : 'Annuler'}
          </Button>
          <AsyncButton priority="primary" onClick={handleConfirm} disabled={!hasChoice || (mode === 'select' && isFetchingDistance)}>
            {confirmLabel}
          </AsyncButton>
        </div>
      </div>
    </Dialog>
  );
}
