import dayjs from 'dayjs';
import type { ReactNode } from 'react';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import Button from '@/components/ui/Button';
import type { EventType } from '@/modules/events/constants';
import type { AdminEvent } from '@/modules/events/server/service';

import type { EventFilters } from './types';

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
      a reconstruit les tuiles <strong>{event.data?.name}</strong>
    </span>
  ),
  demand_assigned: (event, updateFilters) => (
    <>
      <span>a assigné une </span>
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
      <span>a envoyé un email à {event.data?.to} pour une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_linked_to_user: (event) => (
    <span>
      a eu <strong>{event.data?.count}</strong> demande(s) liée(s) à son compte
    </span>
  ),
  demand_relance_sent: (event, updateFilters) => (
    <>
      <span>Une {event.data?.isSecondRelance ? 'seconde ' : 'première '}relance a été envoyée pour la </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
    </>
  ),
  demand_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour une </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'demand' })}>demande</FilterButton>
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
      a synchronisé les géométries vers Airtable pour la table <strong>{event.data?.name}</strong>
    </span>
  ),
  sync_metadata_from_airtable: (event) => (
    <span>
      a synchronisé les métadonnées depuis Airtable pour la table <strong>{event.data?.name}</strong>
    </span>
  ),
  tag_comment_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour un commentaire pour le tag</span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'tag' })}>{event.data?.tag_name}</FilterButton>
    </>
  ),
  tag_reminder_created: (event, updateFilters) => (
    <>
      <span>a enregistré une relance pour le tag</span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'tag' })}>{event.data?.tag_name}</FilterButton>
    </>
  ),
  tag_reminder_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé la relance pour le tag</span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'tag' })}>{event.data?.tag_name}</FilterButton>
    </>
  ),
  user_activated: () => 'a activé son compte',
  user_created: (event, updateFilters) => (
    <>
      <span>a créé le compte </span>
      <FilterButton onClick={() => updateFilters({ contextId: event.context_id, contextType: 'user' })}>
        {event.data.role && <UserRoleBadge role={event.data.role} />}&nbsp;{event.data.email}
      </FilterButton>
    </>
  ),
  user_deleted: () => 'a supprimé un compte',
  user_login: () => "s'est connecté",
  user_newsletter_subscribed: () => "s'est abonné à la newsletter",
  user_newsletter_unsubscribed: () => "s'est désabonné de la newsletter",
  user_password_reset_requested: () => 'a demandé une réinitialisation de mot de passe',
  user_registered: () => 'a créé un compte',
  user_updated: () => 'a mis à jour son profil',
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
