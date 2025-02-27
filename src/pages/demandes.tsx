import Manager from '@/components/Manager/Manager';
import SimplePage from '@/components/shared/page/SimplePage';
import { withAuthentication } from '@/server/authentication';

function Gestionnaire(): React.ReactElement {
  return (
    <SimplePage
      title="Espace gestionnaire"
      description="Votre tableau de bord pour la gestion des demandes des réseaux de chaleur"
      mode="authenticated"
    >
      <Manager />
    </SimplePage>
  );
}

export default Gestionnaire;

export const getServerSideProps = withAuthentication('gestionnaire');
