import Button from '@codegouvfr/react-dsfr/Button';
import { Popover } from '@mui/material';
import Colorful from '@uiw/react-color-colorful';
import { useState } from 'react';

import Box from '@components/ui/Box';
import { formatDistance } from '@utils/geo';

import { MesureFeature } from './mesure';

type MesureFeatureListItemProps = {
  feature: MesureFeature;
  onColorUpdate: (color: string) => void;
  onDelete: () => void;
  disableDeleteButton: boolean;
};

const MesureFeatureListItem: React.FC<MesureFeatureListItemProps> = ({ feature, onColorUpdate, onDelete, disableDeleteButton }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  return (
    <Box display="flex" alignItems="center" key={feature.id}>
      <button
        onClick={(event) => setAnchorEl(event.currentTarget)}
        style={{ padding: 0 }}
        title="Cliquer pour choisir une nouvelle couleur"
      >
        <Box minWidth="20px" height="20px" backgroundColor={feature.properties.color} />
      </button>
      {anchorEl !== null && (
        <Popover
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={anchorEl !== null}
          onClose={() => setAnchorEl(null)}
        >
          <Colorful color={feature.properties.color} onChange={(color) => onColorUpdate(color.hex)} disableAlpha />
        </Popover>
      )}

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
