import { useState } from 'react';

import AsyncButton from '@/components/ui/AsyncButton';
import FCUBadge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Tooltip from '@/components/ui/Tooltip';
import { notify, toastErrors } from '@/modules/notification';
import type { NetworkType } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';

import type { PendingAssignmentChange } from '../types';
import AffectedNetwork from './AffectedNetwork';
import NetworkSelectorDialog, { type NetworkSelection } from './NetworkSelectorDialog';

type BaseDemand = {
  id: string;
  network_id: number | null;
  network_type: NetworkType | null;
  network_name: string | null;
  network_sncu_id: string | null;
  ville_differente?: boolean;
  'Distance au réseau'?: number | null;
  pending_assignment_change: PendingAssignmentChange | null;
  pending_assignment_name: string | null;
  pending_assignment_sncu_id: string | null;
  pending_assignment_author_email: string | null;
};

type AdminProps = {
  isAdmin: true;
  onChangeNetwork: (demandId: string, networkIdFcu: number | null, networkType: NetworkType | null) => void | Promise<void>;
};

type NonAdminProps = {
  isAdmin?: false;
  currentUserId: string;
};

type AffectedNetworkCellProps<T extends BaseDemand> = (AdminProps | NonAdminProps) & {
  demand: T;
};

/**
 * Cellule affichage+action pour le réseau affecté à une demande.
 * - lecture via `AffectedNetwork`
 * - bouton (toujours visible) pour réaffecter (admin) ou demander une réaffectation (non-admin)
 * - bloc "en attente de validation" si `pending_assignment_change` est présent, avec les actions admin
 *   (valider, rejeter) ou auteur (annuler) selon le contexte
 */
export default function AffectedNetworkCell<T extends BaseDemand>(props: AffectedNetworkCellProps<T>) {
  const { demand } = props;
  const [selectorOpen, setSelectorOpen] = useState(false);
  const utils = trpc.useUtils();

  const requestMutation = trpc.demands.gestionnaire.requestAssignmentChange.useMutation({
    onSuccess: () => utils.demands.gestionnaire.list.invalidate(),
  });
  const cancelMutation = trpc.demands.gestionnaire.cancelAssignmentChangeRequest.useMutation({
    onSuccess: () => utils.demands.gestionnaire.list.invalidate(),
  });
  const rejectMutation = trpc.demands.admin.rejectAssignmentChangeRequest.useMutation({
    onSuccess: () => utils.demands.admin.list.invalidate(),
  });

  const handleSelectorConfirm = async (selection: NetworkSelection, comment: string | null) => {
    if (props.isAdmin) {
      await toastErrors(async () => {
        await props.onChangeNetwork(demand.id, selection.networkIdFcu, selection.networkType);
      })();
      setSelectorOpen(false);
    } else {
      await toastErrors(async () => {
        await requestMutation.mutateAsync({
          comment,
          demandId: demand.id,
          networkIdFcu: selection.networkIdFcu,
          networkType: selection.networkType,
        });
        notify('success', 'Demande de réaffectation envoyée');
      })();
      setSelectorOpen(false);
    }
  };

  const handleAcceptPending = async () => {
    if (!props.isAdmin || !demand.pending_assignment_change) return;
    const pending = demand.pending_assignment_change;
    await toastErrors(async () => {
      await props.onChangeNetwork(demand.id, pending.network_id, pending.network_type);
      notify('success', 'Réaffectation appliquée');
    })();
  };

  const handleRejectPending = async () => {
    if (!props.isAdmin || !demand.pending_assignment_change) return;
    if (!confirm('Rejeter cette demande de réaffectation ?')) return;
    await toastErrors(async () => {
      await rejectMutation.mutateAsync({ demandId: demand.id });
      notify('success', 'Demande de réaffectation rejetée');
    })();
  };

  const handleCancelPending = async () => {
    if (props.isAdmin || !demand.pending_assignment_change) return;
    if (!confirm('Annuler votre demande de réaffectation ?')) return;
    await toastErrors(async () => {
      await cancelMutation.mutateAsync({ demandId: demand.id });
      notify('success', 'Demande de réaffectation annulée');
    })();
  };

  const villeDifferente = !!props.isAdmin && !!demand.ville_differente;
  const pending = demand.pending_assignment_change;
  const pendingIsUnassign = !!pending && pending.network_id === null;
  const pendingNotFound = !!pending && !pendingIsUnassign && !demand.pending_assignment_name;
  const canCancelPending = !props.isAdmin && !!pending && pending.author_id === props.currentUserId;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 pt-1.5">
          <AffectedNetwork
            networkName={demand.network_name}
            networkType={demand.network_type}
            networkSncuId={demand.network_sncu_id}
            distance={demand['Distance au réseau']}
          />
          {villeDifferente && <FCUBadge type="warning_ville_differente" size="xs" className="mt-1" />}
        </div>
        <Tooltip title={props.isAdmin ? "Changer l'affectation du réseau" : 'Demander une réaffectation'}>
          <Button
            priority="tertiary"
            size="small"
            iconId="fr-icon-arrow-left-right-line"
            title={props.isAdmin ? "Changer l'affectation" : 'Demander une réaffectation'}
            onClick={() => setSelectorOpen(true)}
            disabled={!props.isAdmin && !!pending}
            className="shrink-0"
          />
        </Tooltip>
      </div>

      {pending && (
        <CallOut
          variant="info"
          size="xs"
          noMarginBottom
          title={pendingIsUnassign ? 'Désaffectation demandée' : 'Réaffectation demandée'}
          bodyAs="div"
        >
          <div className="flex flex-col gap-1 text-xs">
            {pendingIsUnassign ? (
              <span className="text-gray-600 italic">Demande de retrait du réseau affecté</span>
            ) : (
              <AffectedNetwork
                networkName={demand.pending_assignment_name}
                networkType={pending.network_type}
                networkSncuId={demand.pending_assignment_sncu_id}
                distance={pending.distance}
                notFound={pendingNotFound}
              />
            )}
            {pending.comment && <div className="italic text-gray-700">« {pending.comment} »</div>}
            {demand.pending_assignment_author_email && (
              <div className="text-gray-600">Demandé par {demand.pending_assignment_author_email}</div>
            )}

            {props.isAdmin && (
              <div className="flex gap-1 pt-1">
                <AsyncButton
                  size="small"
                  priority="primary"
                  className="mt-0"
                  onClick={handleAcceptPending}
                  disabled={pendingNotFound}
                  title={pendingIsUnassign ? 'Appliquer la désaffectation' : 'Appliquer la réaffectation demandée'}
                >
                  Valider
                </AsyncButton>
                <AsyncButton size="small" priority="secondary" className="mt-0" onClick={handleRejectPending}>
                  Rejeter
                </AsyncButton>
              </div>
            )}
            {canCancelPending && (
              <div className="pt-1">
                <AsyncButton size="small" priority="tertiary" className="mt-0" onClick={handleCancelPending}>
                  Annuler ma demande
                </AsyncButton>
              </div>
            )}
          </div>
        </CallOut>
      )}

      <NetworkSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        demandId={demand.id}
        currentNetworkId={demand.network_id}
        currentNetworkType={demand.network_type}
        isAdmin={!!props.isAdmin}
        onConfirm={handleSelectorConfirm}
      />
    </div>
  );
}
