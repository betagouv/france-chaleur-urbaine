import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Coproprietaire = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return <div></div>;
};

export default Coproprietaire;
