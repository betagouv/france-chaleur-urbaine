import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import styled from 'styled-components';

import NoticeRemovable from '@components/ui/NoticeRemovable';

const NoticeRemovableSticky = styled(NoticeRemovable)`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
`;

const Banner: React.FC = () => {
  const router = useRouter();
  const currentUrl = usePathname();

  if (
    process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR === 'true' &&
    currentUrl &&
    !currentUrl?.startsWith('/outils/comparateur-performances')
  ) {
    return (
      <NoticeRemovableSticky
        className="fr-text--sm"
        style={{ textAlign: 'center' }}
        keyName="comparateur"
        onClick={() => {
          router.push('/outils/comparateur-performances');
        }}
      >
        Comparez les coûts et les emissions de CO2 des différents modes de chauffage, accédez à notre nouveau comparateur
      </NoticeRemovableSticky>
    );
  }

  return null;
};

export default Banner;
