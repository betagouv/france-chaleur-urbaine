import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/chaleur-renouvelable/client/DemandesChaleurRenouvelableAdminPage';

export const getServerSideProps = withAuthentication(['admin']);
