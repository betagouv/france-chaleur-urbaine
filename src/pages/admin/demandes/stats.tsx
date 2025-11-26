import DemandsStatsPage from '@/modules/demands/client/DemandsStatsPage';
import { withAuthentication } from '@/server/authentication';

export default DemandsStatsPage;

export const getServerSideProps = withAuthentication(['admin']);
