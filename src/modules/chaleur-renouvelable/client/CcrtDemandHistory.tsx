import Image from 'next/image';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';
import { dayjs } from '@/utils/date';

import {
  ESPACE_EXTERIEUR_VALUES,
  getEspaceExterieurLabel,
  modeEauChaudeSanitaireOptions,
  typeLogementOptions,
  typeRadiateurOptions,
} from '../constants';
import type { CcrtFollowUp } from '../types';

type CcrtDemandHistoryProps = { followUp: CcrtFollowUp; offset: number; onPageChange: (offset: number) => void };

/**
 * Read-only timeline with notes, expandable sent messages and territorial permission changes.
 */
export function CcrtDemandHistory({ followUp, offset, onPageChange }: CcrtDemandHistoryProps) {
  const history = followUp.history.filter((event) => event.type !== 'ccrt_demand_updated' || getVisibleChanges(event).length > 0);
  return (
    <section className="border-t border-(--border-default-grey) p-4">
      {history.length === 0 && <p className="text-sm">Aucune action enregistrée.</p>}
      <ol className="m-0 list-none space-y-4 p-0 [&>li::marker]:content-none">
        {history.map((event) => {
          const note = event.type === 'ccrt_demand_note_created' ? followUp.notes.find((item) => item.id === event.data.noteId) : undefined;
          const email =
            event.type === 'ccrt_demand_email_sent' ? followUp.emails.find((item) => item.id === event.data.messageId) : undefined;
          return (
            <li key={event.id} className="relative pl-7 text-base leading-6 text-(--text-default-grey)">
              <Image
                src={event.type === 'ccrt_demand_email_sent' ? '/icons/ccrt-timeline-email-dot.svg' : '/icons/ccrt-timeline-dot.svg'}
                alt=""
                width={20}
                height={20}
                className="absolute left-0 top-2"
              />
              <span
                aria-hidden="true"
                className={cx(
                  'absolute bottom-0 left-2.5 top-7 w-px bg-repeat-y',
                  event.type === 'ccrt_demand_email_sent'
                    ? "bg-[url('/icons/ccrt-timeline-email-line.svg')]"
                    : "bg-[url('/icons/ccrt-timeline-line.svg')]"
                )}
              />
              <h5 className="mb-1 text-lg font-medium leading-7">{getEventLabel(event)}</h5>
              {note && (
                <div>
                  <p className="mb-0 whitespace-pre-wrap">{note.body}</p>
                  {note.updated_at !== note.created_at && <p className="mb-0 text-sm">Note modifiée</p>}
                </div>
              )}
              {event.type === 'ccrt_demand_note_created' && !note && <p className="mb-1">Note supprimée</p>}
              {event.type === 'ccrt_demand_updated' && (
                <ul className="m-0 pl-4">
                  {getVisibleChanges(event).map((change) => (
                    <li key={change.field}>
                      {fieldLabels[change.field] ?? change.field} : {change.from} → {change.to}
                    </li>
                  ))}
                </ul>
              )}
              {email && (
                <details className="my-2">
                  <summary className="cursor-pointer text-(--text-action-high-blue-france)">Voir le message : {email.object}</summary>
                  <p className="mb-1">À : {email.to}</p>
                  {email.cc && <p className="mb-1">Copie à : {email.cc}</p>}
                  <p className="mb-1">Répondre à : {email.reply_to}</p>
                  <p className="whitespace-pre-wrap">{email.body}</p>
                  <p className="whitespace-pre-wrap">{email.signature}</p>
                </details>
              )}
              {(event.type === 'user_permissions_updated' || event.type === 'user_permissions_synced_from_api') && (
                <p className="mb-1">Permissions modifiées pour {event.data.user_email}</p>
              )}
              <p className="mb-0 mt-1 text-sm leading-6">
                {[event.first_name, event.last_name].filter(Boolean).join(' ') || event.email || 'Équipe FCU'} · le{' '}
                <time dateTime={event.created_at}>{dayjs(event.created_at).format('D MMMM YYYY')}</time>
              </p>
            </li>
          );
        })}
      </ol>
      {followUp.total > 20 && (
        <nav aria-label="Pages de l’historique" className="mt-4 flex items-center justify-between gap-2">
          <Button size="small" priority="tertiary" disabled={offset === 0} onClick={() => onPageChange(offset - 20)}>
            Précédent
          </Button>
          <span className="text-xs">
            {offset + 1}–{Math.min(offset + 20, followUp.total)} / {followUp.total}
          </span>
          <Button size="small" priority="tertiary" disabled={offset + 20 >= followUp.total} onClick={() => onPageChange(offset + 20)}>
            Suivant
          </Button>
        </nav>
      )}
    </section>
  );
}

const getEventLabel = (event: CcrtFollowUp['history'][number]) =>
  event.type === 'ccrt_demand_updated'
    ? 'status' in event.data.changes
      ? 'Changement de statut'
      : 'Information du bâtiment modifiée'
    : (eventLabels[event.type] ?? 'Suivi');
const eventLabels: Record<string, string> = {
  ccrt_demand_email_sent: 'Mail envoyé',
  ccrt_demand_note_created: 'Note interne',
  ccrt_demand_note_deleted: 'Note supprimée',
  ccrt_demand_note_updated: 'Note modifiée',
  user_permissions_synced_from_api: 'Accès',
  user_permissions_updated: 'Accès',
};
const formatValue = (value: unknown): string =>
  value == null || (typeof value === 'string' && !value.trim())
    ? 'Non renseigné'
    : Array.isArray(value)
      ? value.join(', ') || 'Aucun'
      : typeof value === 'boolean'
        ? value
          ? 'Oui'
          : 'Non'
        : String(value);
const fieldLabels: Record<string, string> = {
  address: 'Adresse',
  annual_heating_consumption: 'Consommation annuelle (MWh/an)',
  assigned_to: 'Affectation',
  average_area: 'Surface moyenne (m²)',
  average_residents: 'Habitants moyens',
  comments: 'Commentaire',
  dpe: 'DPE',
  heating_energy: 'Énergie',
  hot_water_system_type: 'Eau chaude',
  housing_count: 'Nombre de logements',
  housing_type: 'Type de logement',
  is_public_advisor_selected: 'Refus de raccordement',
  outdoor_space: 'Espaces extérieurs',
  project_state: 'État du projet',
  project_status: 'Avancement déclaré',
  radiator_type: 'Radiateurs',
  refusal_period: 'Période du refus',
  refusal_reason: 'Motif du refus',
  rnic_nom_copropriete: 'Copropriété',
  rnic_numero_immatriculation: 'Immatriculation',
  rnic_siret_representant_legal: 'SIRET',
  status: 'Statut',
  surface_area: 'Surface totale (m²)',
};

const formatFieldValue = (field: string, value: unknown) => {
  const outdoorSpace = ESPACE_EXTERIEUR_VALUES.find((option) => option === value);
  if (field === 'outdoor_space' && outdoorSpace) {
    return getEspaceExterieurLabel(outdoorSpace);
  }
  const options =
    field === 'housing_type'
      ? typeLogementOptions
      : field === 'radiator_type'
        ? typeRadiateurOptions
        : field === 'hot_water_system_type'
          ? modeEauChaudeSanitaireOptions
          : [];
  return options.find((option) => option.value === value)?.label ?? formatValue(value);
};

const getVisibleChanges = (event: Extract<CcrtFollowUp['history'][number], { type: 'ccrt_demand_updated' }>) =>
  Object.entries(event.data.changes)
    .map(([field, change]) => ({ field, from: formatFieldValue(field, change.from), to: formatFieldValue(field, change.to) }))
    .filter((change) => change.from !== change.to);
