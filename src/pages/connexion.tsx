import { z } from 'zod';

import { LoginForm, type LoginFormProps } from '@/components/connexion/LoginForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import { withServerSession } from '@/server/authentication';
import { logger } from '@/server/helpers/logger';
import { activateUser } from '@/server/services/auth';

function ConnectionPage(props: LoginFormProps): JSX.Element {
  return (
    <SimplePage title="Espace connecté" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <CenterLayout maxWidth="600px">
        <Heading as="h1" size="h2" color="blue-france">
          Connectez-vous
        </Heading>
        <LoginForm {...props} />
      </CenterLayout>
    </SimplePage>
  );
}

export const getServerSideProps = withServerSession(async ({ context, session }) => {
  // in case of next-auth error, we reuse the notify query param
  if (context.query.error) {
    return {
      redirect: {
        destination: `/connexion?notify=error:${encodeURIComponent(context.query.error as string)}`,
        permanent: false,
      },
    };
  }

  // activation token after registration
  if (context.query.activationToken) {
    try {
      const activationToken = await z.string().max(100).parseAsync(context.query.activationToken);
      await activateUser(activationToken);
      return {
        redirect: {
          destination: `/connexion?notify=success:${encodeURIComponent(
            'Votre email a été confirmé. Vous pouvez maintenant vous connecter à France Chaleur Urbaine.'
          )}`,
          permanent: false,
        },
      };
    } catch (err: any) {
      logger.error('activation error', { err });
      return {
        redirect: {
          destination: `/connexion?notify=error:${encodeURIComponent("Le jeton de confirmation n'est pas valide")}`,
          permanent: false,
        },
      };
    }
  }

  if (session) {
    return {
      redirect: {
        destination: '/pro/tableau-de-bord',
        permanent: false,
      },
    };
  }

  return {
    props: {
      callbackUrl: (context.query.callbackUrl as string) || '/pro/tableau-de-bord',
    },
  };
});

export default ConnectionPage;
