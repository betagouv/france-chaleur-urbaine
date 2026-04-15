import dynamic from 'next/dynamic';

import ProfileForm from '@/components/connexion/ProfileForm';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { withAuthentication } from '@/server/authentication';
import { userRolesWithPermissions } from '@/types/enum/UserRole';

const PermissionsView = dynamic(() => import('@/modules/permissions/client/PermissionsView'), { ssr: false });

export default function MonComptePage() {
  const { hasRole } = useAuthentication();
  const showPermissions = userRolesWithPermissions.some((role) => hasRole(role));

  return (
    <SimplePage title="Mon compte" mode="authenticated">
      <div className="fr-container my-4w">
        <Heading as="h1" color="blue-france">
          Mon compte
        </Heading>
        <div className="max-w-xl">
          <ProfileForm />
        </div>

        {showPermissions && (
          <div className="mt-6w">
            <Heading as="h2" color="blue-france">
              Mes permissions
            </Heading>
            <PermissionsView />
          </div>
        )}
      </div>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication();
