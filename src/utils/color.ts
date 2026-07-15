/**
 * Darkens a given hexadecimal color by reducing its RGB components by a specified amount.
 *
 * @param hexColor - A hexadecimal color string (e.g., "#RRGGBB").
 * @param darkness - The amount to decrease each RGB component (0-255).
 * @returns The darkened hexadecimal color as a string.
 *
 * @example
 * darken("#ffcc00", 30); // "#d9a300"
 */
export function darken(hexColor: string, darkness: number): string {
  const intValue = +`0x${hexColor.substring(1)}`;
  const r = Math.min(Math.max(Math.round(intValue / 65536) - darkness, 0), 255).toString(16);
  const g = Math.min(Math.max(Math.round((intValue / 256) % 256) - darkness, 0), 255).toString(16);
  const b = Math.min(Math.max(Math.round(intValue % 256) - darkness, 0), 255).toString(16);

  return `#${[r.length === 1 ? `0${r}` : r, g.length === 1 ? `0${g}` : g, b.length === 1 ? `0${b}` : b].join('')}`;
}

/**
 * Picks black or white text for the best contrast over a given hex background,
 * using the perceived-luminance (YIQ) formula.
 *
 * @param hexColor - A hexadecimal color string (e.g., "#RRGGBB").
 * @returns DSFR near-black for light backgrounds, white for dark ones.
 *
 * @example
 * getContrastTextColor("#ffe599"); // "#161616"
 * getContrastTextColor("#1f7a8c"); // "#ffffff"
 */
export function getContrastTextColor(hexColor: string): '#161616' | '#ffffff' {
  const intValue = Number.parseInt(hexColor.slice(1), 16);
  const r = (intValue >> 16) & 0xff;
  const g = (intValue >> 8) & 0xff;
  const b = intValue & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '#161616' : '#ffffff';
}
