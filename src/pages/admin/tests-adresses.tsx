import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/pro-eligibility-tests/client/TestsAddressesAdminPage';

export const getServerSideProps = withAuthentication(['admin']);
