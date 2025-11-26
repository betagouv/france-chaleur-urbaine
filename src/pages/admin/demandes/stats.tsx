import DemandesStatsPage from '@/modules/demands/client/DemandesStatsPage';
import { withAuthentication } from '@/server/authentication';

export default DemandesStatsPage;

export const getServerSideProps = withAuthentication(['admin']);
