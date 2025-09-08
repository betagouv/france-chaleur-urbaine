import { type ReactElement } from 'react';

/**
 * Formate un nombre pour l'affichage en ajoutant des espaces comme séparateurs de milliers.
 * @param number - Le nombre à formater
 * @param precision - Nombre de décimales à conserver (optionnel)
 * @returns Le nombre formaté sous forme de chaîne de caractères, ou null si l'entrée n'est pas un nombre
 */
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
        .normalize('NFD') // Normalize to decompose accented characters
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritical marks (accents)
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

function formatNumberWithUnit(value: number, unitSuffix: string): ReactElement {
  let unit: string;

  if (value >= 1e6) {
    value /= 1e6;
    unit = `T${unitSuffix}`;
  } else if (value >= 1e3) {
    value /= 1e3;
    unit = `G${unitSuffix}`;
  } else {
    unit = `M${unitSuffix}`;
  }

  return (
    <>
      {value.toPrecision(3)}&nbsp;{unit}
    </>
  );
}

export function formatMW(value: number): ReactElement {
  return formatNumberWithUnit(value, 'W');
}

export function formatMWh(value: number): ReactElement {
  return formatNumberWithUnit(value, 'Wh');
}

export function formatMWhAn(value: number): ReactElement {
  return formatNumberWithUnit(value, 'Wh/an');
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

/**
 * Upper case the first character of a string.
 */
export function upperCaseFirstChar(string: string): string {
  return `${(string[0] ?? '').toUpperCase()}${string.substring(1)}`;
}

export function formatFileSize(size: number): string {
  return `${Math.round(size / 1024 / 1024)} Mo`;
}

export function slugify(text?: string | null) {
  return text
    ? normalize(text)
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with a single one
    : text;
}

const frenchCollator = new Intl.Collator('fr', { sensitivity: 'base' });

export const compareFrenchStrings = (a: string | undefined | null, b: string | undefined | null) =>
  frenchCollator.compare(a ?? '', b ?? '');

export function formatFrenchSpacing(text: string): string {
  return text
    .replace(/ (\?|!|:|;|»)/g, '\u00A0$1') // non-breaking space before ? ! : ; »
    .replace(/(«) /g, '$1\u00A0'); // non-breaking space after «
}

/**
 * Parse an unknown charset text buffer to a string.
 * Allows fixing the encoding of a text buffer that is not UTF-8 (e.g. ISO-8859-1).
 * @param textBuffer - The text buffer to parse.
 * @returns The parsed string.
 */
export async function parseUnknownCharsetText(textBuffer: ArrayBuffer): Promise<string> {
  const chardet = await import('chardet');
  const textUint8Array = new Uint8Array(textBuffer);
  const detectedEncoding = chardet.detect(textUint8Array) ?? 'utf-8';
  return new TextDecoder(detectedEncoding).decode(textUint8Array);
}
