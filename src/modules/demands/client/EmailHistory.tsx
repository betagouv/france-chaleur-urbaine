import dayjs from 'dayjs';
import Loader from '@/components/ui/Loader';
import Tooltip from '@/components/ui/Tooltip';
import type { RouterOutput } from '@/modules/trpc/client';

type EmailItem = RouterOutput['demands']['user']['listEmails'][number];

type EmailHistoryItemProps = {
  item: EmailItem;
  onEmailClick?: (emailKey: string) => void;
};

const EmailHistoryItem = ({ item, onEmailClick }: EmailHistoryItemProps) => {
  return (
    <li key={item.email_key} onClick={() => onEmailClick?.(item.email_key)} className={onEmailClick ? 'cursor-pointer' : ''}>
      <Tooltip
        className="max-w-[600px] min-w-[300px]"
        title={
          <div className="max-h-96 overflow overflow-auto">
            <div className="text-sm mb-1">
              À: <strong>{item.to}</strong>
            </div>
            {item.cc && (
              <div className="text-sm mb-1">
                Copie à: <strong>{item.cc}</strong>
              </div>
            )}
            <div className="text-sm mb-1">
              Répondre à: <strong>{item.reply_to}</strong>
            </div>
            <div className="p-2 border border-dashed border-gray-200 bg-gray-50">
              <h4 className="font-mono text-sm">{item.object}</h4>
              <p className="whitespace-pre-line font-mono text-sm">{item.body.replaceAll('<br />', '\n')}</p>
            </div>
          </div>
        }
      >
        <span>
          <span className={onEmailClick ? 'underline cursor-help' : ''}>{item.object}</span> -{' '}
          <small className="text-faded italic">
            envoyé le <time dateTime={dayjs(item.sent_at).toISOString()}>{dayjs(item.sent_at).format('dddd D MMMM YYYY')}</time>
          </small>
        </span>
      </Tooltip>
    </li>
  );
};

type EmailHistoryProps = {
  emails: RouterOutput['demands']['user']['listEmails'] | null;
  isLoading: boolean;
  onEmailClick?: (emailKey: string) => void;
  showTitle?: boolean;
};

const EmailHistory = ({ emails, isLoading, onEmailClick, showTitle = true }: EmailHistoryProps) => {
  return (
    <section className="fr-mt-3w fr-mb-3w">
      {showTitle && <h4>Historique</h4>}
      <ul className="fr-ml-3w">
        {isLoading ? (
          <li>
            <Loader size="sm" />
          </li>
        ) : emails && emails.length > 0 ? (
          emails.map((item) => <EmailHistoryItem key={item.email_key} item={item} onEmailClick={onEmailClick} />)
        ) : (
          <li>Aucun courriel envoyé</li>
        )}
      </ul>
    </section>
  );
};

export default EmailHistory;
