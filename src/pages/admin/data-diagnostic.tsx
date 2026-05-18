import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/data-diagnostic/client/DataDiagnosticPage';

export const getServerSideProps = withAuthentication(['admin']);
