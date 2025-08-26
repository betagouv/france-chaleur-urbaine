import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/events/client/AdminEventsPage';

export const getServerSideProps = withAuthentication(['admin']);
