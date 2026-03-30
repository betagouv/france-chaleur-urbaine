import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import dayjs from 'dayjs';

import Button from '@/components/ui/Button';
import { type EventGranularity, type EventPeriodPreset, eventGranularities, eventPeriodPresets } from '@/modules/events/constants';

// biome-ignore assist/source/useSortedKeys: trié par intervalle croissant
const presetLabels: Record<EventPeriodPreset, string> = {
  '1h': '1 heure',
  today: "Aujourd'hui",
  '1w': '1 semaine',
  '2w': '2 semaines',
  '1m': '1 mois',
  '2m': '2 mois',
  '3m': '3 mois',
  '6m': '6 mois',
  '1y': '1 an',
  custom: 'Personnalisé',
};

const granularityLabels: Record<EventGranularity, string> = {
  day: 'Jour',
  hour: 'Heure',
  minute: 'Minute',
  month: 'Mois',
  week: 'Semaine',
  year: 'Année',
};

type EventsDashboardHeaderProps = {
  preset: EventPeriodPreset;
  granularity: EventGranularity;
  dateFrom: string | null;
  dateTo: string | null;
  onPresetChange: (preset: EventPeriodPreset) => void;
  onGranularityChange: (granularity: EventGranularity) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onExport: () => void;
  onRefresh: () => void;
};

/**
 * Barre de contrôle du dashboard : sélection de période (presets + custom), granularité, rafraîchir et exporter.
 */
export function EventsDashboardHeader({
  preset,
  granularity,
  dateFrom,
  dateTo,
  onPresetChange,
  onGranularityChange,
  onDateFromChange,
  onDateToChange,
  onExport,
  onRefresh,
}: EventsDashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-44">
          <Select
            label="Période"
            nativeSelectProps={{
              onChange: (e) => onPresetChange(e.target.value as EventPeriodPreset),
              value: preset,
            }}
            options={eventPeriodPresets.map((p) => ({ label: presetLabels[p], value: p }))}
          />
        </div>

        <div className="w-44">
          <Select
            label="Granularité"
            nativeSelectProps={{
              onChange: (e) => onGranularityChange(e.target.value as EventGranularity),
              value: granularity,
            }}
            options={eventGranularities.map((g) => ({ label: granularityLabels[g], value: g }))}
          />
        </div>

        <div className="flex gap-2 pb-1">
          <Button size="small" priority="secondary" iconId="ri-refresh-line" onClick={onRefresh}>
            Rafraîchir
          </Button>

          <Button size="small" priority="secondary" iconId="ri-download-line" onClick={onExport}>
            Exporter
          </Button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" htmlFor="events-date-from">
              Du
            </label>
            <input
              id="events-date-from"
              type="datetime-local"
              className="fr-input w-auto"
              value={dateFrom ? dayjs(dateFrom).format('YYYY-MM-DDTHH:mm') : ''}
              max={dateTo ? dayjs(dateTo).format('YYYY-MM-DDTHH:mm') : undefined}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" htmlFor="events-date-to">
              Au
            </label>
            <input
              id="events-date-to"
              type="datetime-local"
              className="fr-input w-auto"
              value={dateTo ? dayjs(dateTo).format('YYYY-MM-DDTHH:mm') : ''}
              min={dateFrom ? dayjs(dateFrom).format('YYYY-MM-DDTHH:mm') : undefined}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
