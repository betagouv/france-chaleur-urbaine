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
