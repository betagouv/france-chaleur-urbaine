import { Alert } from '@codegouvfr/react-dsfr/Alert';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useState } from 'react';
import { clientConfig } from '@/client-config';
import useForm from '@/components/form/react-form/useForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { default as Section, SectionContent, SectionTitle } from '@/components/ui/Section';
import { zAddRelanceCommentInput } from '@/modules/demands/constants';
import { updateSatisfactionFromRelanceId } from '@/modules/demands/server/demands-service';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

function Satisfaction({ relanceId, satisfaction }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [sent, setSent] = useState(false);

  const { mutateAsync: addRelanceComment } = trpc.demands.user.addRelanceComment.useMutation({
    onSuccess: () => {
      setSent(true);
    },
  });

  const { Form, Textarea, Submit, HiddenInput } = useForm({
    defaultValues: {
      comment: '',
      relanceId,
    },
    onSubmit: toastErrors(async ({ value }) => {
      await addRelanceComment({ comment: value.comment, relanceId });
      setSent(true);
    }),
    schema: zAddRelanceCommentInput,
  });

  return (
    <SimplePage noIndex>
      <Section>
        <SectionTitle>
          {satisfaction ? 'Merci pour votre retour ! Vous souhaitez nous en dire plus ?' : 'Merci pour votre retour !'}
        </SectionTitle>
        {!satisfaction && (
          <SectionContent>
            Les gestionnaires des réseaux de chaleur recevant actuellement un nombre important de demandes, les délais de prise en charge
            peuvent être allongés. N'hésitez pas à vérifier vos spams, les mails de gestionnaires peuvent être considérés comme indésirables
            par votre boîte mail.
            <br />
            Nous relançons le gestionnaire du réseau concerné par votre demande afin que vous puissiez être recontacté au plus vite. Nous
            vous remercions pour votre patience.
            <br />
            <br />
            <h5>Vous souhaitez nous en dire plus ?</h5>
          </SectionContent>
        )}
        {sent ? (
          <Alert severity="success" title="Merci pour votre retour." />
        ) : (
          <Form className="flex flex-col gap-4">
            <HiddenInput name="relanceId" label="" />
            <Textarea name="comment" label="Commentaire" />
            <Submit>Envoyer</Submit>
          </Form>
        )}
        <br />
        <br />
        <p>
          Pour partager votre retour d’expérience de vive voix, n’hésitez pas{' '}
          <a href={clientConfig.calendarLink} target="_blank" rel="noreferrer">
            à prendre rendez-vous avec l’équipe France Chaleur Urbaine
          </a>
        </p>
      </Section>
    </SimplePage>
  );
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { id: relanceId, satisfaction: satisfactionParam } = context.query;
  const satisfaction = satisfactionParam === 'true';

  await updateSatisfactionFromRelanceId(relanceId as string, satisfaction);

  return {
    props: {
      relanceId: relanceId as string,
      satisfaction,
    },
  };
};

export default Satisfaction;
