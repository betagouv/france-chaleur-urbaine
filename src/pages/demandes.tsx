import { type GetServerSideProps } from 'next';

import Manager from '@/components/Manager/Manager';
import SimplePage from '@/components/shared/page/SimplePage';
import { withAuthentication } from '@/server/helpers/ssr/withAuthentication';

export default function Gestionnaire(): JSX.Element {
  // FIXME vérifier que la vérif des permissions fonctionne sans ce code nul
  // const { data: session } = useSession();
  // useEffect(() => {
  //   if (session && !session.user.gestionnaires) {
  //     signOut();
  //   }
  // }, [session]);

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

export const getServerSideProps: GetServerSideProps = withAuthentication('gestionnaire');
