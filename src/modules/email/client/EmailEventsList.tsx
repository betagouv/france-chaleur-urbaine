import Tag from '@/components/ui/Tag';
import { getEmailEventLabel } from '@/modules/email/constants';
import type { RouterOutput } from '@/modules/trpc/client';
import { formatFrenchDateTime } from '@/utils/date';

type EmailEvent = RouterOutput['email']['deliverability']['listEmailEvents']['events'][number];

type EmailEventsListProps = {
  events: EmailEvent[];
  /** Raw Brevo API error message, when the events could not be fetched. */
  errorMessage: string | null;
};

/**
 * Timeline of the Brevo events (requests, delivered, bounces, blocked…) for one recipient over the last 90 days.
 */
function EmailEventsList({ events, errorMessage }: EmailEventsListProps) {
  if (errorMessage) {
    return (
      <p className="text-sm text-faded m-0">
        Historique Brevo indisponible : erreur lors de l'appel à l'API. <span className="wrap-break-words">{errorMessage}</span>
      </p>
    );
  }
  if (events.length === 0) {
    return <p className="text-sm text-faded m-0">Aucun événement Brevo sur les 90 derniers jours.</p>;
  }
  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-1 max-h-64 overflow-y-auto">
      {events.map((event, index) => {
        const eventLabel = getEmailEventLabel(event.event);
        return (
          <li key={`${event.messageId ?? index}-${event.event}-${event.date}`} className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="shrink-0 text-xs text-faded w-32">{formatFrenchDateTime(new Date(event.date))}</span>
            <Tag size="sm" variant={eventLabel.severity} outline>
              {eventLabel.label}
            </Tag>
            {event.subject && <span className="text-faded truncate max-w-md">{event.subject}</span>}
            {event.reason && <span className="basis-full text-xs text-faded pl-34 wrap-break-words">{event.reason}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export default EmailEventsList;
