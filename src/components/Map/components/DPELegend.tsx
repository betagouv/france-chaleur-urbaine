import { themeDefBuildings } from 'src/services/Map/businessRules';
import { Box, Boxes, SubTitle, Title } from './DPELegend.style';

const DPELegend = () => {
  return (
    <>
      <Title>Cliquer sur le bâtiment souhaité</Title>
      <SubTitle>Diagnostic de performance énergétique</SubTitle>
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
    </>
  );
};

export default DPELegend;
