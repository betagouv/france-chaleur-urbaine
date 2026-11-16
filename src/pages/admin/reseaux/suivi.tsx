import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/demands/client/network-tracking/NetworkTrackingPage';

export const getServerSideProps = withAuthentication(['admin']);
