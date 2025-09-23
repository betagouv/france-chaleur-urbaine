import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/diagnostic/client/DiagnosticPage';

export const getServerSideProps = withAuthentication(['admin']);
