import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/organizations/client/admin/AdminOrganizationsPage';
export const getServerSideProps = withAuthentication(['admin']);
