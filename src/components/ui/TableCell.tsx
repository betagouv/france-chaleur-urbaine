import { Badge } from '@codegouvfr/react-dsfr/Badge';
import Image from 'next/image';
import React, { memo } from 'react';

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
  Date: never;
  DateTime: never;
  Json: never;
};

export type TableCellProps<T> = {
  value: any;
  data: T;
  children: React.ReactNode;
  type?: keyof CellProps<T>;
  cellProps?: Partial<CellProps<T>[keyof CellProps<T>]>;
};

const Cell = <T,>({ value, children: defaultValue, data, type, cellProps = {} }: TableCellProps<T>) => {
  if (!value && type !== 'Boolean') {
    return defaultValue;
  }
  if (type === 'DateTime' || type === 'Date') {
    const date = new Date(value);

    if (type === 'DateTime') {
      return (
        <span className="block">
          <span className="block whitespace-nowrap">{date.toLocaleDateString()}</span>
          <span className="block font-sans text-xs uppercase text-gray-400">{date.toLocaleTimeString()}</span>
        </span>
      );
    } else if (type === 'Date') {
      return (
        <time dateTime={date.toISOString()} title={date.toLocaleString()}>
          {date.toLocaleDateString()}
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
      style: 'currency',
      currency: 'EUR',
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

export default memo(Cell, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value) &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});
