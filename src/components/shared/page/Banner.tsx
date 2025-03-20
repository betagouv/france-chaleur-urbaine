import { fr } from '@codegouvfr/react-dsfr';
import { usePathname } from 'next/navigation';
import React from 'react';
import styled from 'styled-components';

import Link from '@/components/ui/Link';
import NoticeRemovable from '@/components/ui/NoticeRemovable';
import { useAuthentication } from '@/services/authentication';

const NoticeRemovableSticky = styled(NoticeRemovable)`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
`;

const Banner: React.FC = () => {
  const currentUrl = usePathname();
  const { isAuthenticated } = useAuthentication();

  if (!currentUrl || currentUrl?.startsWith('/comparateur-couts-performances')) {
    return null;
  }

  return (
    <NoticeRemovableSticky className={fr.cx('fr-text--sm')} style={{ textAlign: 'center' }} keyName="comparateur">
      Comparez les coûts et les émissions de CO2 des différents modes de chauffage,{' '}
      <Link href={`${isAuthenticated ? '/pro' : ''}/comparateur-couts-performances`}>accédez à notre nouveau comparateur</Link>
    </NoticeRemovableSticky>
  );
};

export default Banner;
