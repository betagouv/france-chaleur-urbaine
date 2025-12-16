import ProfileForm from '@/components/connexion/ProfileForm';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import { withAuthentication } from '@/server/authentication';

export default function MonComptePage() {
  return (
    <SimplePage title="Mon compte" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Mon compte
      </Heading>
      <div className="max-w-xl">
        <ProfileForm />
      </div>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication();
