import dayjs from 'dayjs';
import type { ReactNode } from 'react';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import Button from '@/components/ui/Button';
import type { EventType } from '@/modules/events/constants';
import type { AdminEvent } from '@/modules/events/server/service';

import type { EventFilters } from './types';

const networkTypeLabels = {
  perimetre_de_developpement_prioritaire: 'PDP',
  reseau_de_chaleur: 'réseau de chaleur',
  reseau_de_froid: 'réseau de froid',
  reseau_en_construction: 'réseau en construction',
} as const;

const formatNetworkLabel = (data: {
  network_type: keyof typeof networkTypeLabels;
  network_id: number;
  nom_reseau: string | null;
  identifiant_reseau: string | null;
  first_commune?: string | null;
  communes_count?: number;
}): string => {
  if (data.network_type === 'perimetre_de_developpement_prioritaire') {
    if (data.identifiant_reseau) return data.identifiant_reseau;
    if (data.first_commune) {
      return data.communes_count && data.communes_count > 1
        ? `${data.first_commune} (+${data.communes_count - 1} communes)`
        : data.first_commune;
    }
    return `PDP ${data.network_id}`;
  }
  return data.nom_reseau || data.identifiant_reseau || `Réseau ${data.network_id}`;
};

const FilterButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <Button size="small" priority="tertiary no outline" className="px-1!" onClick={onClick}>
    {children}
  </Button>
);

type EventRenderer<T extends EventType> = (
  event: Extract<AdminEvent, { type: T }>,
  updateFilters: (filters: Partial<EventFilters>) => void
) => ReactNode;

export const eventLabelRenderers: { [T in EventType]: EventRenderer<T> } = {
  build_tiles: (event) => (
    <span>
      a reconstruit les tuiles <strong>{event.data.name}</strong>
    </span>
  ),
  demand_assigned: (event, updateFilters) => (
    <>
      <span>a assigné une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_assignment_change_request_cancelled: (event, updateFilters) => (
    <>
      <span>a annulé sa demande de réaffectation sur une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_assignment_change_request_rejected: (event, updateFilters) => (
    <>
      <span>a rejeté une demande de réaffectation sur une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_assignment_change_requested: (event, updateFilters) => (
    <>
      <span>a demandé une réaffectation pour une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_assignment_changed: (event, updateFilters) => (
    <>
      <span>a réaffecté une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_created: (event, updateFilters) => (
    <>
      <span>Une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
      <span> a été créée</span>
    </>
  ),
  demand_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_email_sent: (event, updateFilters) => (
    <>
      <span>a envoyé un email à {event.data.to} pour une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_linked_to_user: (event) => (
    <span>
      a eu <strong>{event.data.count}</strong> demande(s) liée(s) à son compte
    </span>
  ),
  demand_relance_sent: (event, updateFilters) => (
    <>
      <span>Une {event.data.isSecondRelance ? 'seconde ' : 'première '}relance a été envoyée pour la </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_validated: (event, updateFilters) => (
    <>
      <span>a validé une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  network_created: (event) => (
    <span>
      a créé un réseau <strong>{event.data.type}</strong> (ID: {event.data.id})
    </span>
  ),
  network_deleted: (event) => (
    <span>
      a supprimé un réseau <strong>{event.data.type}</strong>
      {event.data.nom_reseau ? ` "${event.data.nom_reseau}"` : null} (ID: {event.data.id}
      {event.data.identifiant_reseau ? `, SNCU: ${event.data.identifiant_reseau}` : null})
    </span>
  ),
  network_geometries_applied: (event) => (
    <span>
      a appliqué les modifications géométriques sur <strong>{event.data.name}</strong> (<strong>{event.data.processed.created}</strong>{' '}
      créés, <strong>{event.data.processed.updated}</strong> mis à jour, <strong>{event.data.processed.deleted}</strong> supprimés
      {event.data.affected_bboxes_count > 0 ? `, ${event.data.affected_bboxes_count} zones d'éligibilité affectées` : null})
    </span>
  ),
  network_geometry_updated: (event) => (
    <span>
      a mis à jour la géométrie d'un réseau <strong>{event.data.type}</strong>
      {event.data.nom_reseau ? ` "${event.data.nom_reseau}"` : null} (ID: {event.data.id}
      {event.data.identifiant_reseau ? `, SNCU: ${event.data.identifiant_reseau}` : null})
    </span>
  ),
  network_notes_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour les notes du {networkTypeLabels[event.data.network_type]} </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: event.data.network_type })}>
        {formatNetworkLabel(event.data)}
      </FilterButton>
    </>
  ),
  network_reminder_created: (event, updateFilters) => (
    <>
      <span>a enregistré une relance pour le {networkTypeLabels[event.data.network_type]} </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: event.data.network_type })}>
        {event.data.network_id}
      </FilterButton>
    </>
  ),
  network_reminder_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé une relance du {networkTypeLabels[event.data.network_type]} </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: event.data.network_type })}>
        {event.data.network_id}
      </FilterButton>
    </>
  ),
  network_reminder_updated: (event, updateFilters) => (
    <>
      <span>
        a modifié une relance (<strong>{Object.keys(event.data.changes ?? {}).join(', ')}</strong>) du{' '}
        {networkTypeLabels[event.data.network_type]}{' '}
      </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: event.data.network_type })}>
        {event.data.network_id}
      </FilterButton>
    </>
  ),
  pdp_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour le </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'pdp' })}>
        périmètre de développement
      </FilterButton>
    </>
  ),
  pro_eligibility_test_created: (event, updateFilters) => (
    <>
      <span>a créé un </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'pro_eligibility_test' })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  pro_eligibility_test_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé un </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'pro_eligibility_test' })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  pro_eligibility_test_renamed: (event, updateFilters) => (
    <>
      <span>a renommé un </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'pro_eligibility_test' })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  pro_eligibility_test_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour un </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'pro_eligibility_test' })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  sync_geometries_to_airtable: (event) => (
    <span>
      a synchronisé les géométries vers Airtable pour la table <strong>{event.data.name}</strong>
    </span>
  ),
  sync_metadata_from_airtable: (event) => (
    <span>
      a synchronisé les métadonnées depuis Airtable pour la table <strong>{event.data.name}</strong>
    </span>
  ),
  tag_comment_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour un commentaire pour le tag</span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'tag' })}>{event.data.tag_name}</FilterButton>
    </>
  ),
  tag_reminder_created: (event, updateFilters) => (
    <>
      <span>a enregistré une relance pour le tag</span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'tag' })}>{event.data.tag_name}</FilterButton>
    </>
  ),
  tag_reminder_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé la relance pour le tag</span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'tag' })}>{event.data.tag_name}</FilterButton>
    </>
  ),
  user_activated: () => 'a activé son compte',
  user_created: () => 'a créé un compte',
  user_created_by_admin: (event, updateFilters) => (
    <>
      <span>
        a créé le compte (<strong>{event.data.role}</strong>){' '}
      </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'user' })}>
        {event.data.user_email}
      </FilterButton>
    </>
  ),
  user_deleted_by_admin: (event, updateFilters) => (
    <>
      <span>a supprimé le compte </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'user' })}>
        {event.data.user_email}
      </FilterButton>
    </>
  ),
  user_login: () => "s'est connecté",
  user_password_reset_requested: () => 'a demandé une réinitialisation de mot de passe',
  user_permissions_synced_from_api: (event, updateFilters) => (
    <>
      <span>
        Permissions ajoutées (<strong>{event.data.added.length}</strong>) via l'API <strong>{event.data.api_name}</strong> pour
      </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'user' })}>
        {event.data.user_email}
      </FilterButton>
    </>
  ),
  user_permissions_updated: (event, updateFilters) => (
    <>
      <span>
        a modifié les permissions (+<strong>{event.data.added.length}</strong> / -<strong>{event.data.removed.length}</strong>) de
      </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'user' })}>
        {event.data.user_email}
      </FilterButton>
    </>
  ),
  user_profile_updated: (event) => (
    <span>
      a mis à jour son profil (<strong>{Object.keys(event.data.changes).join(', ')}</strong>)
    </span>
  ),
  user_updated_by_admin: (event, updateFilters) => (
    <>
      <span>a mis à jour le compte </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'user' })}>
        {event.data.user_email}
      </FilterButton>
      <span>
        {' '}
        (<strong>{Object.keys(event.data.changes).join(', ')}</strong>)
      </span>
    </>
  ),
};

type EventRowProps = {
  event: AdminEvent;
  updateFilters: (filters: Partial<EventFilters>) => void;
  showDetails: boolean;
};

/**
 * Ligne d'événement avec rendu spécialisé par type, boutons de filtre contextuel et détails JSON.
 */
export function EventRow({ event, updateFilters, showDetails }: EventRowProps) {
  return (
    <div className="flex items-center gap-2 border-b border-b-gray-200 px-2 py-1">
      <div className="shrink-0 w-30 text-xs text-gray-500">{dayjs(event.created_at).format('DD/MM/YYYY HH:mm:ss')}</div>
      {event.author ? (
        <>
          <UserRoleBadge role={event.author.role} />
          <FilterButton
            onClick={() =>
              updateFilters({
                authorId: event.author_id,
              })
            }
          >
            {event.author.email}
          </FilterButton>
        </>
      ) : null}
      <div className="text-sm">{(eventLabelRenderers[event.type] as EventRenderer<typeof event.type>)(event, updateFilters)}</div>
      {showDetails && event.data && typeof event.data === 'object' && Object.keys(event.data).length > 0 ? (
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(event.data, null, 2).slice(2, -2)}</pre>
      ) : null}
    </div>
  );
}
