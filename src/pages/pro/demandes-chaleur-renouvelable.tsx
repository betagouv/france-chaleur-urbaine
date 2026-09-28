import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/chaleur-renouvelable/client/DemandesChaleurRenouvelableCcrtPage';

export const getServerSideProps = withAuthentication(['ccrt', 'admin']);
