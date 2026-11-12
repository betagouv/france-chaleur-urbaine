import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/custom-territories/client/admin/AdminCustomTerritoriesPage';
export const getServerSideProps = withAuthentication(['admin']);
