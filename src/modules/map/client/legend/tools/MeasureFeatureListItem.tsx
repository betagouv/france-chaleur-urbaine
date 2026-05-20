import Colorful from '@uiw/react-color-colorful';

import Button from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { formatDistance } from '@/modules/geo/client/helpers';

import type { MeasureFeature } from '../../layers/specs/tools/measure';

type MeasureFeatureListItemProps = {
  feature: MeasureFeature;
  onColorUpdate: (color: string) => void;
  onDelete: () => void;
  disableDeleteButton: boolean;
};

/** Row in the distance-measurement list: color picker + total distance + delete. */
export function MeasureFeatureListItem({ feature, onColorUpdate, onDelete, disableDeleteButton }: MeasureFeatureListItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="size-5 shrink-0 rounded-xs" style={{ backgroundColor: feature.properties.color }} />
        </PopoverTrigger>
        <PopoverContent side="bottom" sideOffset={2} className="ml-4">
          <Colorful color={feature.properties.color} onChange={(color: { hex: string }) => onColorUpdate(color.hex)} disableAlpha />
        </PopoverContent>
      </Popover>

      <div className="flex-1">
        Distance totale : <strong>{formatDistance(feature.properties.distance)}</strong>
      </div>

      <Button
        priority="tertiary no outline"
        size="small"
        iconId="fr-icon-delete-bin-line"
        onClick={onDelete}
        title="Supprimer le tracé"
        disabled={disableDeleteButton}
      />
    </div>
  );
}
