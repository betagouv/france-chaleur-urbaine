export function prettyFormatNumber(
  number: number | null | undefined,
  precision?: number
): string | null {
  return typeof number === 'number'
    ? (precision !== undefined
        ? number.toFixed(precision)
        : number.toString()
      ).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
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
