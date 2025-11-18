import ReseauxDemandesStatsPage from '@/modules/demands-legacy/client/admin/ReseauxDemandesStatsPage';
import { withAuthentication } from '@/server/authentication';

export default ReseauxDemandesStatsPage;

export const getServerSideProps = withAuthentication(['admin']);
