import type { ColumnFiltersState } from '@tanstack/react-table';
import { Fragment, useCallback, useMemo } from 'react';

import { VerticalDivider } from '@/components/ui/Divider';
import Indicator from '@/components/ui/Indicator';
import type { QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';

type QuickFilterPresetsProps<TData, TPresets extends Record<string, QuickFilterPreset<TData>>> = {
  presets: TPresets;
  data: TData[];
  loading?: boolean;
  columnFilters: ColumnFiltersState;
  onFiltersChange: (filters: ColumnFiltersState) => void;
  hideDividerOnMobile?: boolean;
  className?: string;
};

function QuickFilterPresets<TData, TPresets extends Record<string, QuickFilterPreset<TData>>>({
  presets,
  data,
  loading = false,
  columnFilters,
  onFiltersChange,
  hideDividerOnMobile = true,
  className,
}: QuickFilterPresetsProps<TData, TPresets>) {
  // Calculate statistics for each preset
  const presetStats = useMemo(
    () =>
      ObjectKeys(presets).reduce(
        (acc, key) => ({
          ...acc,
          [key]: presets[key].getStat?.(data) ?? 0,
        }),
        {} as Record<keyof TPresets, number>
      ),
    [presets, data]
  );

  // Check if a preset is currently active
  const isPresetActive = useCallback(
    (presetKey: keyof TPresets): boolean => {
      const preset = presets[presetKey];
      if (preset.filters.length === 0) {
        return columnFilters.length === 0;
      }

      return (
        preset.filters.every((presetFilter) =>
          columnFilters.some((activeFilter: any) => activeFilter.id === presetFilter.id && activeFilter.value === presetFilter.value)
        ) && columnFilters.length === preset.filters.length
      );
    },
    [presets, columnFilters]
  );

  // Toggle a preset on/off
  const toggleFilterPreset = useCallback(
    (presetKey: keyof TPresets) => {
      const preset = presets[presetKey];
      onFiltersChange(isPresetActive(presetKey) ? [] : preset.filters);
    },
    [presets, isPresetActive, onFiltersChange]
  );

  const presetEntries = ObjectEntries(presets);

  return (
    <>
      {presetEntries.map(([key, preset], index) => (
        <Fragment key={String(key)}>
          <Indicator
            loading={loading}
            label={preset.label}
            value={presetStats[key]}
            valueSuffix={'valueSuffix' in preset ? preset.valueSuffix : undefined}
            onClick={() => toggleFilterPreset(key)}
            active={isPresetActive(key)}
            className={className}
          />
          {index < presetEntries.length - 1 && <VerticalDivider className={hideDividerOnMobile ? 'hidden md:block' : undefined} />}
        </Fragment>
      ))}
    </>
  );
}

export default QuickFilterPresets;
