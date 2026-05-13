import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/pro-eligibility-tests/client/TestsAdressesPage';

export const getServerSideProps = withAuthentication([
  'particulier',
  'professionnel',
  'gestionnaire',
  'collectivite',
  'alec',
  'ccrt',
  'admin',
]);
