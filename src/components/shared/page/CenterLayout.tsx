import type { PropsWithChildren } from 'react';

import Box, { type BoxProps } from '@/components/ui/Box';

/**
 * Offre une disposition adaptée pour du contenu relativement petit avec un contour gris.
 */
const CenterLayout = ({ children, ...props }: PropsWithChildren<BoxProps>) => (
  <Box py="4w" className="fr-container" display="grid" placeContent="center">
    <Box border="1px solid #eee" p="4w" {...props}>
      {children}
    </Box>
  </Box>
);

export default CenterLayout;
