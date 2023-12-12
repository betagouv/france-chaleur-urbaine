export function prettyFormatNumber(
  number: number | null | undefined
): string | null {
  return typeof number === 'number'
    ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : null;
}
