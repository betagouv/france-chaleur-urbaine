import { GetServerSideProps } from 'next';

import BulkEligibility from '@components/Admin/BulkEligibility';
import UserImpersonation from '@components/Admin/UserImpersonation';
import Users from '@components/Admin/Users';
import SimplePage from '@components/shared/page/SimplePage';
import { withAuthentication } from '@helpers/ssr/withAuthentication';

export default function AdminPage(): JSX.Element {
  return (
    <SimplePage title="France Chaleur Urbaine - Admin" mode="authenticated">
      <UserImpersonation />
      <Users />
      <BulkEligibility />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = withAuthentication('admin');
