import ProfileForm from '@/components/connexion/ProfileForm';
import ProfileNewsletterForm from '@/components/connexion/ProfileNewsletterForm';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import { withAuthentication } from '@/server/authentication';

export default function MonComptePage() {
  return (
    <SimplePage title="Mon compte" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Mon compte
      </Heading>
      <div className="max-w-xl flex flex-col gap-10">
        <section>
          <Heading as="h2" size="h5">
            Informations personnelles
          </Heading>
          <ProfileForm />
        </section>
        <section>
          <Heading as="h2" size="h5">
            Newsletter
          </Heading>
          <ProfileNewsletterForm />
        </section>
      </div>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication();
