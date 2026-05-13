import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/email/client/admin/EmailsPage';

export const getServerSideProps = withAuthentication(['admin']);
