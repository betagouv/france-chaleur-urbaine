import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React, { memo } from 'react';

import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import { isDefined } from '@/utils/core';

// import ContentEditable from './ContentEditable';

type CellProps<T> = {
  Image: Omit<React.ComponentProps<typeof Image>, 'src' | 'onClick'> & { onClick?: (imageUrl: string) => void };
  Number: Intl.NumberFormatOptions;
  Percent: Intl.NumberFormatOptions;
  Price: Intl.NumberFormatOptions;
  NoWrap: React.ComponentProps<'span'>;
  Link: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string | ((data: T) => string) };
  Boolean: never;
  Array: never;
  Date: Parameters<typeof Date.prototype.toLocaleString>[1];
  DateTime: Parameters<typeof Date.prototype.toLocaleDateString>[1];
  Json: never;
};

export type TableCellProps<T> = {
  value: any;
  data: T;
  children: React.ReactNode;
  type?: keyof CellProps<T>;
  cellProps?: Partial<CellProps<T>[keyof CellProps<T>]>;
  /**
   * Si true, force l'utilisation du rendu personnalisé (children) même si le type est défini.
   * Utile quand on veut un tri/filtrage par type mais un rendu personnalisé.
   */
  forceCellRender?: boolean;
};

const TableCell = <T,>({ value, children: defaultValue, data, type, cellProps = {}, forceCellRender = false }: TableCellProps<T>) => {
  // Si forceCellRender est true, on utilise toujours le rendu personnalisé
  if (forceCellRender) {
    return defaultValue;
  }

  if (!value && type !== 'Boolean') {
    return defaultValue;
  }
  const hasCellProps = Object.keys(cellProps).length > 0;
  if (type === 'DateTime' || type === 'Date') {
    if (type === 'DateTime') {
      const dateTime = new Date(value);
      return (
        <span className="block" suppressHydrationWarning>
          <time dateTime={dateTime.toISOString()} className="block">
            {dateTime.toLocaleDateString(undefined, hasCellProps ? (cellProps as Intl.DateTimeFormatOptions) : { dateStyle: 'medium' })}
          </time>
          <time dateTime={dateTime.toISOString()} className="block font-sans text-xs uppercase text-gray-400">
            {dateTime.toLocaleTimeString(undefined, hasCellProps ? (cellProps as Intl.DateTimeFormatOptions) : { timeStyle: 'short' })}
          </time>
        </span>
      );
    } else if (type === 'Date') {
      const date = new Date(value);
      const computedCellProps: Intl.DateTimeFormatOptions = hasCellProps
        ? (cellProps as Intl.DateTimeFormatOptions)
        : { dateStyle: 'long' };
      return (
        <time dateTime={date.toISOString()} title={date.toLocaleString(undefined, computedCellProps)} suppressHydrationWarning>
          {date.toLocaleString(undefined, computedCellProps)}
        </time>
      );
    }
  } else if (type === 'Json') {
    return <pre className="max-h-24 max-w-60 overflow-auto bg-gray-800 p-1 text-xs text-white">{JSON.stringify(value, null, 2)}</pre>;
  } else if (type === 'Boolean') {
    return (
      isDefined(value) && (
        <Badge noIcon severity={value ? 'success' : 'error'} small>
          {value ? 'Oui' : 'Non'}
        </Badge>
      )
    );
  } else if (type === 'NoWrap') {
    return <span className="whitespace-nowrap">{value}</span>;
  } else if (type === 'Link') {
    const linkProps = cellProps as CellProps<T>['Link'];
    const { href, ...linkCellProps } = linkProps || {};
    let processedHref = href;
    if (typeof href === 'string') {
      processedHref = href.replace('[id]', (data as any).id);
    } else {
      processedHref = href?.(data);
    }

    if (!href) {
      return value;
    }
    return (
      <Link
        className="link link-neutral"
        href={processedHref as string}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
        {...linkCellProps}
      >
        {value}
      </Link>
    );
  } else if (type === 'Number') {
    return (value as number).toLocaleString(undefined, cellProps as Intl.NumberFormatOptions);
  } else if (type === 'Percent') {
    return (value as number).toLocaleString(undefined, {
      style: 'percent',
      ...(cellProps ? (cellProps as Intl.NumberFormatOptions) : { minimumFractionDigits: 2 }),
    });
  } else if (type === 'Price') {
    return (value as number).toLocaleString('fr-FR', {
      currency: 'EUR',
      style: 'currency',
      ...(cellProps as Intl.NumberFormatOptions),
    });
  } else if (type === 'Image') {
    const imageProps = cellProps as CellProps<T>['Image'];
    const { onClick, alt, ...restCellProps } = imageProps || {};

    const onImageClick = (imageUrl: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onClick?.(imageUrl);
    };

    return <Image alt={alt || ''} src={value} {...(onClick ? { onClick: onImageClick(value) } : {})} {...restCellProps} />;
  } else if (type === 'Array') {
    return <span>{value.join(', ')}</span>;
  }

  if (React.isValidElement(value)) {
    return React.cloneElement(value);
  }

  return defaultValue;
};

export default memo(TableCell, (prevProps, nextProps) => {
  // Éviter la sérialisation JSON qui peut causer des erreurs de structure circulaire
  // Comparer directement les types et les valeurs
  return prevProps.type === nextProps.type && isEqual(prevProps.value, nextProps.value) && isEqual(prevProps.data, nextProps.data);
});

// Fonction utilitaire pour comparer des objets sans sérialisation JSON
function isEqual(a: any, b: any): boolean {
  // Si les références sont identiques
  if (a === b) return true;

  // Si l'un est null/undefined mais pas l'autre
  if (a == null || b == null) return a === b;

  // Types différents
  if (typeof a !== typeof b) return false;

  // Pour les tableaux
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  // Pour les objets (non-null)
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => a[key] === b[key]);
  }

  // Pour les autres types primitifs
  return a === b;
}
