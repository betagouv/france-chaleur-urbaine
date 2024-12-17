import { caracteristiquesBatimentsLayerStyle } from '@/components/Map/layers/caracteristiquesBatiments';

import Box from './ui/Box';

type DPEProps = {
  classe: string; // no type yet because there are mixed upper and lower case values...
};

function DPE({ classe }: DPEProps) {
  const color = (caracteristiquesBatimentsLayerStyle as any)[classe.toLowerCase()];
  return (
    <Box width="24px" height="24px" fontSize="18px" backgroundColor={color} textColor="white" textAlign="center">
      {classe.toUpperCase()}
    </Box>
  );
}

export default DPE;
