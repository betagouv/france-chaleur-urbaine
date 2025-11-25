import type { ReactNode } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { dayjs, formatFrenchDateTime } from '@/utils/date';

type TimeagoProps = {
  date: string | Date;
  className?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

/**
 * Composant qui affiche le nombre de jours en relatif par rapport à aujourd'hui.
 * Affiche une tooltip avec la date complète au survol.
 *
 * @example
 * ```tsx
 * <Timeago date={new Date()} />
 * <Timeago date="2024-01-15" prefix="Dernière connexion " />
 * <Timeago date="2024-01-15" prefix="Créé " suffix=" par admin" />
 * ```
 */
export default function Timeago({ date, className, prefix, suffix }: TimeagoProps) {
  const targetDate = dayjs(date);
  const diffInDays = Math.round(targetDate.diff(dayjs(), 'day', true));

  let text: string;
  if (diffInDays === 0) {
    text = "aujourd'hui";
  } else if (diffInDays === 1) {
    text = 'demain';
  } else if (diffInDays === -1) {
    text = 'hier';
  } else if (diffInDays > 0) {
    text = `dans ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  } else {
    text = `il y a ${-diffInDays} jour${-diffInDays > 1 ? 's' : ''}`;
  }

  const fullDate = formatFrenchDateTime(targetDate.toDate());

  return (
    <Tooltip title={fullDate}>
      <span className={className}>
        {prefix}
        {text}
        {suffix}
      </span>
    </Tooltip>
  );
}
