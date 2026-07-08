import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/conversion-tracking/client/ConversionAbusePage';

export const getServerSideProps = withAuthentication(['admin']);
