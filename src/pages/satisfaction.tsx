import { Alert } from '@codegouvfr/react-dsfr/Alert';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import { default as Section, SectionContent, SectionTitle } from '@/components/ui/Section';
import { zAddRelanceCommentInput } from '@/modules/demands/constants';
import { updateSatisfactionFromRelanceId } from '@/modules/demands/server/relances';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

function Satisfaction({ relanceId, satisfaction }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [sent, setSent] = useState(false);

  const { mutateAsync: addRelanceComment } = trpc.demands.user.addRelanceComment.useMutation({
    onSuccess: () => {
      setSent(true);
    },
  });

  const form = useAppForm({
    ...schemaValidation(zAddRelanceCommentInput),
    defaultValues: {
      comment: '',
      relanceId,
    },
    onSubmit: toastErrors(async ({ value }) => {
      await addRelanceComment({ comment: value.comment, relanceId });
      setSent(true);
    }),
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
          <Form form={form} className="flex flex-col gap-4">
            <form.AppField name="comment">{(field) => <field.TextareaField label="Commentaire" />}</form.AppField>
            <form.SubmitButton>Envoyer</form.SubmitButton>
          </Form>
        )}
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
