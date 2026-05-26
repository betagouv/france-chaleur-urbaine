import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/map/client/admin/IframeGeneratorPage';

export const getServerSideProps = withAuthentication(['admin']);
