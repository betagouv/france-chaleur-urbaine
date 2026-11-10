import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/demands/client/network-tracking/NetworkTrackingDetailPage';

export const getServerSideProps = withAuthentication(['admin']);
