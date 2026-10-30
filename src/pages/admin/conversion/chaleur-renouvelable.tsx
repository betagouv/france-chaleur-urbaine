import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/simulation-tracking/client/SimulationsConversionPage';

export const getServerSideProps = withAuthentication(['admin']);
