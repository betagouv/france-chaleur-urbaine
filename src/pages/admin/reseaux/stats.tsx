import ReseauxStatsPage from '@/modules/demands/client/ReseauxStatsPage';
import { withAuthentication } from '@/server/authentication';

export default ReseauxStatsPage;

export const getServerSideProps = withAuthentication(['admin']);
