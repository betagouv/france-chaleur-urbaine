import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/network-change-requests/client/AdminNetworkChangeRequestsPage';

export const getServerSideProps = withAuthentication(['admin']);
