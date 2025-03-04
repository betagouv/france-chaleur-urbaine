import { Badge } from '@codegouvfr/react-dsfr/Badge';
import Image from 'next/image';
import React from 'react';

import Link from '@/components/ui/Link';
import { isDefined } from '@/utils/core';
// import ContentEditable from './ContentEditable';

export type TableCellType =
  | 'Array'
  | 'Date'
  | 'DateTime'
  | 'Array'
  | 'Link'
  | 'Json'
  | 'Number'
  | 'Boolean'
  | 'Image'
  | 'NoWrap'
  | 'Percent';

export type TableCellProps<T> = {
  type?: TableCellType;
  value: any;
  default: any;
  data: T;
  cellProps?: any;
} & (TableCellType extends 'Image' ? { cellProps: React.ComponentProps<typeof Image> } : {});

const Cell = <T,>({ value, type, default: defaultValue, data, cellProps = {} }: TableCellProps<T>) => {
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
    const { href, ...linkCellProps } = cellProps;
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
    return value;
  } else if (type === 'Percent') {
    return (value as number).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2, ...cellProps });
  } else if (type === 'Image') {
    const { onClick, alt, ...restCellProps } = cellProps;
    const onImageClick = (imageUrl: string) => (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      onClick(imageUrl);
    };

    return <Image alt={alt} src={value} {...(onClick ? { onClick: onImageClick(value) } : {})} {...restCellProps} />;
  } else if (type === 'Array') {
    return <span>{value.join(', ')}</span>;
  }

  if (React.isValidElement(value)) {
    return React.cloneElement(value);
  }

  return defaultValue;
};

export default Cell;
