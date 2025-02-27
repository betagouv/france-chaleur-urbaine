import BulkEligibility from '@/components/Admin/BulkEligibility';
import UserImpersonation from '@/components/Admin/UserImpersonation';
import Users from '@/components/Admin/Users';
import SimplePage from '@/components/shared/page/SimplePage';
import { withAuthentication } from '@/server/authentication';

function AdminPage(): React.ReactElement {
  return (
    <SimplePage title="France Chaleur Urbaine - Admin" mode="authenticated">
      <UserImpersonation />
      <Users />
      <BulkEligibility />
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication('admin');

export default AdminPage;
