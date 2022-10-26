import Ressource from '@components/Ressources/Ressource';
import MainContainer from '@components/shared/layout';
import { useRouter } from 'next/router';

const RessourcePage = () => {
  const router = useRouter();
  return (
    <MainContainer currentMenu={`/gestionnaire/${router.query.ressource}`}>
      <Ressource ressourceKey={router.query.ressource as string} />
    </MainContainer>
  );
};

export default RessourcePage;
