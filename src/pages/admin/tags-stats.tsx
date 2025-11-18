import TagsStatsPage from '@/modules/demands-legacy/client/admin/TagsStatsPage';
import { withAuthentication } from '@/server/authentication';

export default TagsStatsPage;

export const getServerSideProps = withAuthentication(['admin']);
