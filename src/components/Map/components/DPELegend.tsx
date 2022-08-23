import { themeDefBuildings } from 'src/services/Map/businessRules';
import { Box, Boxes } from './DPELegend.style';

const DPELegend = () => {
  return (
    <Boxes>
      {Object.entries(themeDefBuildings.colors)
        .filter(([letter]) => letter.length === 1)
        .map(([letter, { color }]) => {
          return (
            <Box key={letter} color={color}>
              {letter.toUpperCase()}
            </Box>
          );
        })}
    </Boxes>
  );
};

export default DPELegend;
