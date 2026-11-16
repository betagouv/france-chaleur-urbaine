import TimeAgo from '@/components/ui/TimeAgo';
import { businessRules } from '@/modules/app/business-rules';
import { dayjs } from '@/utils/date';

import { historyStartLabel } from './format';

type LastManagerActionProps = {
  date: string | null;
};

/**
 * Date of the last action of a manager on a network, in red once past the silence threshold or when none is recorded.
 */
export function LastManagerAction({ date }: LastManagerActionProps) {
  if (!date) {
    return <span className="text-error">Aucune depuis {historyStartLabel}</span>;
  }
  const isRecent = dayjs().diff(date, 'day') <= businessRules.networkTrackingSilentDays.value;
  return <TimeAgo date={date} className={isRecent ? 'text-success' : 'text-error'} />;
}
