import type { PropsWithChildren } from 'react';

import Box, { type BoxProps } from '@/components/ui/Box';

/**
 * Offre une disposition adaptée pour du contenu relativement petit avec un contour gris.
 * La boîte a une largeur stable (100% plafonnée par `maxWidth`) : son contenu
 * dynamique (messages d'erreur…) ne fait pas varier sa largeur.
 */
const CenterLayout = ({ children, ...props }: PropsWithChildren<BoxProps>) => (
  <Box py="4w" className="fr-container flex justify-center">
    <Box border="1px solid #eee" p="4w" width="100%" maxWidth="600px" {...props}>
      {children}
    </Box>
  </Box>
);

export default CenterLayout;
