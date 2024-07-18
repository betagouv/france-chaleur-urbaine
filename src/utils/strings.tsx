import { ReactElement } from 'react';

export function prettyFormatNumber(number: number | null | undefined, precision?: number): string | null {
  return typeof number === 'number'
    ? (precision !== undefined ? number.toFixed(precision) : number.toString()).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : null;
}

/**
 * Normalize a string (lower case and remove accents).
 */
export function normalize(string: string | undefined | null): string {
  return string === null || string === undefined
    ? ''
    : string
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converts a ratio number between 0 and 1 to its hexadecimal notation.
 */
export function ratioToHex(ratio: number): string {
  if (ratio < 0 || ratio > 1) {
    throw new Error(`invalid input: ${ratio}`);
  }

  const hex = Math.floor(ratio * 255).toString(16);
  return `${hex.length === 1 ? '0' : ''}${hex}`;
}

export function formatMWh(value: number): ReactElement {
  let unit: string;

  if (value >= 1e6) {
    value /= 1e6;
    unit = 'TWh/an';
  } else if (value >= 1e3) {
    value /= 1e3;
    unit = 'GWh/an';
  } else {
    unit = 'MWh/an';
  }

  return (
    <>
      {value.toPrecision(3)}&nbsp;{unit}
    </>
  );
}

export function formatMWhString(value: number): string {
  let unit: string;

  if (value >= 1e6) {
    value /= 1e6;
    unit = 'TWh/an';
  } else if (value >= 1e3) {
    value /= 1e3;
    unit = 'GWh/an';
  } else {
    unit = 'MWh/an';
  }

  return `${value.toPrecision(3)} ${unit}`;
}
