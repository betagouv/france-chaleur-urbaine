import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/conversion-tracking/client/ConversionStatsPage';

export const getServerSideProps = withAuthentication(['admin']);
