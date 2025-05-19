import Colorful from '@uiw/react-color-colorful';

import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { formatDistance } from '@/utils/geo';

import { type MeasureFeature } from './measure';

type MesureFeatureListItemProps = {
  feature: MeasureFeature;
  onColorUpdate: (color: string) => void;
  onDelete: () => void;
  disableDeleteButton: boolean;
};

const MesureFeatureListItem: React.FC<MesureFeatureListItemProps> = ({ feature, onColorUpdate, onDelete, disableDeleteButton }) => {
  return (
    <Box display="flex" alignItems="center" key={feature.id}>
      <Popover>
        <PopoverTrigger asChild>
          <Box minWidth="20px" height="20px" backgroundColor={feature.properties.color} />
        </PopoverTrigger>
        <PopoverContent side="bottom" sideOffset={2} className="ml-[16px]">
          <Colorful color={feature.properties.color} onChange={(color: { hex: string }) => onColorUpdate(color.hex)} disableAlpha />
        </PopoverContent>
      </Popover>

      <Box flex ml="1w">
        Distance totale : <strong>{formatDistance(feature.properties.distance)}</strong>
      </Box>

      <Button
        priority="tertiary no outline"
        size="small"
        iconId="fr-icon-delete-bin-line"
        onClick={() => onDelete()}
        title="Supprimer le tracé"
        disabled={disableDeleteButton}
      />
    </Box>
  );
};

export default MesureFeatureListItem;
