import { Badge } from '@codegouvfr/react-dsfr/Badge';
import type { ReactNode } from 'react';

import cx from '@/utils/cx';

type ValueCellContext = { value: unknown };

const isDateLike = (value: unknown): value is string | number | Date =>
  value instanceof Date || typeof value === 'string' || typeof value === 'number';

const toDate = (value: string | number | Date): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Default rendering when a column has no `cell`: primitives as text, booleans as Oui/Non,
 * arrays joined, dates localized; objects render nothing (define a `cell`).
 */
export const renderDefaultCell = (value: unknown): ReactNode => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('fr-FR');
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  return typeof value === 'object' ? null : String(value);
};

/** Cell renderers for common value types; assign them to a column `cell` (`cell: cells.date()`). */
export const cells = {
  boolean:
    () =>
    ({ value }: ValueCellContext) =>
      typeof value === 'boolean' ? (
        <Badge noIcon severity={value ? 'success' : 'error'} small>
          {value ? 'Oui' : 'Non'}
        </Badge>
      ) : null,
  date:
    (options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
    ({ value }: ValueCellContext) => {
      const date = isDateLike(value) ? toDate(value) : null;
      return date ? (
        <time dateTime={date.toISOString()} title={date.toLocaleString('fr-FR')} suppressHydrationWarning>
          {date.toLocaleDateString('fr-FR', options)}
        </time>
      ) : null;
    },
  dateTime:
    () =>
    ({ value }: ValueCellContext) => {
      const date = isDateLike(value) ? toDate(value) : null;
      return date ? (
        <time dateTime={date.toISOString()} className="block leading-tight" suppressHydrationWarning>
          {date.toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
          <span className="block text-xs text-gray-500">{date.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}</span>
        </time>
      ) : null;
    },
  list:
    (className?: string) =>
    ({ value }: ValueCellContext) =>
      Array.isArray(value) && value.length > 0 ? (
        <span className={cx(className)}>{value.map((item) => String(item)).join(', ')}</span>
      ) : null,
  number:
    (options: Intl.NumberFormatOptions = {}) =>
    ({ value }: ValueCellContext) =>
      typeof value === 'number' ? value.toLocaleString('fr-FR', options) : null,
  percent:
    (options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }) =>
    ({ value }: ValueCellContext) =>
      typeof value === 'number' ? value.toLocaleString('fr-FR', { style: 'percent', ...options }) : null,
  price:
    (options: Intl.NumberFormatOptions = {}) =>
    ({ value }: ValueCellContext) =>
      typeof value === 'number' ? value.toLocaleString('fr-FR', { currency: 'EUR', style: 'currency', ...options }) : null,
};
