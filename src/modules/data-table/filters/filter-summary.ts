import type { DateRangeFilterValue, FilterDef } from './filter-types';
import { EMPTY_FACET_KEY } from './filter-types';

const formatDate = (isoDate: string): string => new Date(isoDate).toLocaleDateString('fr-FR');

const facetLabel = (key: string, formatOption: ((key: string) => unknown) | undefined): string => {
  if (key === EMPTY_FACET_KEY) {
    return 'Aucun';
  }
  if (key === 'true' || key === 'false') {
    return key === 'true' ? 'Oui' : 'Non';
  }
  const formatted = formatOption?.(key);
  return typeof formatted === 'string' ? formatted : key;
};

/** One-line human summary of an active filter value, for the toolbar chips. */
export const summarizeFilterValue = <Row>(filter: FilterDef<Row>, value: unknown): string => {
  switch (filter.type) {
    case 'facets': {
      const keys = value as string[];
      return keys.length > 3 ? `${keys.length} valeurs` : keys.map((key) => facetLabel(key, filter.formatOption)).join(', ');
    }
    case 'range': {
      const [min, max] = value as [number, number];
      const format = filter.formatNumber ?? ((number: number) => number.toLocaleString('fr-FR'));
      const unit = filter.unit ? ` ${filter.unit}` : '';
      return `${format(min)} – ${format(max)}${unit}`;
    }
    case 'dateRange': {
      const range = value as DateRangeFilterValue;
      const parts = [
        range.from && `du ${formatDate(range.from)}`,
        range.to && `au ${formatDate(range.to)}`,
        range.includeEmpty && 'vides incluses',
      ];
      return parts.filter(Boolean).join(' ');
    }
    case 'text':
      return `« ${value as string} »`;
    case 'emptyOrFilled':
      return value === 'filled' ? (filter.filledLabel ?? 'Rempli') : (filter.emptyLabel ?? 'Vide');
    case 'custom':
      return 'actif';
  }
};
