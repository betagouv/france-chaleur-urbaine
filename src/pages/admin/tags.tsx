import TagsPage from '@/modules/tags/client/admin/TagsPage';
import { withAuthentication } from '@/server/authentication';
export default TagsPage;
export const getServerSideProps = withAuthentication(['admin']);
