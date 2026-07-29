export type PublicodesUnit = {
  numerators: string[];
  denominators: string[];
};

export type PublicodesNodeValue = number | string | boolean | null | undefined;

/** Formats a publicodes unit as a compact string, e.g. { numerators: [€TTC], denominators: [an] } → "€TTC / an" */
export const formatUnit = ({ numerators, denominators }: PublicodesUnit): string => {
  const superscript = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const format = (parts: string[], delimiter: string = ''): string => {
    const count: Record<string, number> = parts.reduce((accumulator: Record<string, number>, part: string) => {
      accumulator[part] = (accumulator[part] || 0) + 1;
      return accumulator;
    }, {});
    return Object.entries(count)
      .map(([part, occurrences]) => part + (occurrences > 1 ? superscript[occurrences] : ''))
      .join(delimiter);
  };
  const nums = format(numerators);
  const dens = format(denominators, '/');
  return nums + (dens ? ` / ${dens}` : '');
};

/** Formats a publicodes node value for display: oui/non, fr-FR numbers, strings without publicodes quotes */
export const formatNodeValue = (value: PublicodesNodeValue): string => {
  if (value === undefined || value === null) {
    return 'non défini';
  }
  if (typeof value === 'boolean') {
    return value ? 'oui' : 'non';
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 1 ? 2 : 4,
    }).format(value);
  }
  return value.replace(/^'|'$/g, '');
};
