import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const Conseiller = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace(router.asPath.replace('conseiller', 'professionnels'));
  }, [router]);

  return <div></div>;
};

export default Conseiller;
