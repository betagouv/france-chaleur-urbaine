import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import { MfaVerificationForm, type MfaVerificationFormProps } from '@/modules/auth/client/MfaVerificationForm';
import { getMfaEnrollment } from '@/modules/auth/server/mfa';
import { getPendingMfaUserId, withServerSession } from '@/server/authentication';
import { stripDomainFromURL } from '@/utils/url';

function MfaVerificationPage(props: MfaVerificationFormProps): JSX.Element {
  return (
    <SimplePage title="Double authentification" description="Vérification du second facteur de votre compte France Chaleur Urbaine.">
      <CenterLayout maxWidth="500px">
        <Heading as="h1" size="h2" color="blue-france">
          Double authentification
        </Heading>
        <MfaVerificationForm {...props} />
      </CenterLayout>
    </SimplePage>
  );
}

export const getServerSideProps = withServerSession(async ({ context, session }) => {
  if (session) {
    return { redirect: { destination: '/pro/tableau-de-bord', permanent: false } };
  }
  const userId = await getPendingMfaUserId(context);
  if (!userId) {
    return { redirect: { destination: '/connexion', permanent: false } };
  }

  return {
    props: {
      callbackUrl: stripDomainFromURL(context.query.callbackUrl as string) || '/pro/tableau-de-bord',
      enrollment: await getMfaEnrollment(userId),
    },
  };
});

export default MfaVerificationPage;
