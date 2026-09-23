import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/retention/client/AdminRetentionPage';

export const getServerSideProps = withAuthentication(['admin']);
