import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/reseaux/client/admin/AdminReseauxPage';

export const getServerSideProps = withAuthentication(['admin']);
