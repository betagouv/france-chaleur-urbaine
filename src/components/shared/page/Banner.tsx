import { fr } from '@codegouvfr/react-dsfr';
import { usePathname } from 'next/navigation';
import React from 'react';
import styled from 'styled-components';

import Link from '@components/ui/Link';
import NoticeRemovable from '@components/ui/NoticeRemovable';

const NoticeRemovableSticky = styled(NoticeRemovable)`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
`;

const Banner: React.FC = () => {
  const currentUrl = usePathname();

  if (
    process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR !== 'true' ||
    !currentUrl ||
    currentUrl?.startsWith('/outils/comparateur-performances')
  ) {
    return null;
  }

  return (
    <NoticeRemovableSticky className={fr.cx('fr-text--sm')} style={{ textAlign: 'center' }} keyName="comparateur">
      Comparez les coûts et les émissions de CO2 des différents modes de chauffage,{' '}
      <Link href="/outils/comparateur-performances">accédez à notre nouveau comparateur</Link>
    </NoticeRemovableSticky>
  );
};

export default Banner;
