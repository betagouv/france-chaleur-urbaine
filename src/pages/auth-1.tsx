import SimplePage from '@/components/shared/page/SimplePage';
import { withAuthentication } from '@/server/authentication';

const AidePage = () => {
  return (
    <SimplePage title="Aide" mode="authenticated">
      <div className="text-center">auth 1</div>
    </SimplePage>
  );
};

export default AidePage;

export const getServerSideProps = withAuthentication();
