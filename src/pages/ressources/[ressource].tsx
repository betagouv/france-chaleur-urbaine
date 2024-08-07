import { useRouter } from 'next/router';

import Ressource from '@components/Ressources/Ressource';
import SimplePage from '@components/shared/page/SimplePage';

const RessourcePage = () => {
  const router = useRouter();
  return (
    <SimplePage currentPage="/ressources">
      <Ressource ressourceKey={router.query.ressource as string} />
    </SimplePage>
  );
};

export default RessourcePage;
