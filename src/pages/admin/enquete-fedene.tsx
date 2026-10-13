import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/fedene-survey/client/FedeneSurveyPage';

export const getServerSideProps = withAuthentication(['admin']);
