import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/email/client/admin/EmailDeliverabilityPage';

export const getServerSideProps = withAuthentication(['admin']);
