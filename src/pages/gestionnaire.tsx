import Manager from '@/components/Manager/Manager';
import SimplePage from '@/components/shared/page/SimplePage';
import { withAuthentication } from '@/server/authentication';

export default function Gestionnaire(): JSX.Element {
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

export const getServerSideProps = withAuthentication();
