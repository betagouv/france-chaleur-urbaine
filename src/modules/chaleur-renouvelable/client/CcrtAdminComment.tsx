import Alert from '@codegouvfr/react-dsfr/Alert';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { zCcrtAdminComment } from '../constants';

type CcrtAdminCommentProps = { demandId: string };

/**
 * Loads private comments only through the admin route, outside every shared demand payload.
 */
export function CcrtAdminComment({ demandId }: CcrtAdminCommentProps) {
  const query = trpc.batEnr.admin.getAdminComment.useQuery({ demandId });
  return (
    <section className="border-t border-(--border-default-grey) p-4">
      <h3 className="mb-2 text-lg">Commentaires internes FCU</h3>
      <p className="text-sm">Visibles uniquement par les administrateurs.</p>
      {query.isError ? (
        <>
          <Alert severity="error" small description="Impossible de charger le commentaire." />
          <Button priority="tertiary" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        </>
      ) : query.data ? (
        <AdminCommentForm key={`${demandId}-${query.data.admin_comment}`} demandId={demandId} comment={query.data.admin_comment} />
      ) : (
        <p role="status">Chargement…</p>
      )}
    </section>
  );
}

type AdminCommentFormProps = { demandId: string; comment: string };

/**
 * Saves the private comment independently from public follow-up fields.
 */
function AdminCommentForm({ demandId, comment }: AdminCommentFormProps) {
  const mutation = trpc.batEnr.admin.updateAdminComment.useMutation();
  const utils = trpc.useUtils();
  const form = useAppForm({
    ...schemaValidation(zCcrtAdminComment),
    defaultValues: { comment, demandId },
    onSubmit: toastErrors(async ({ value }) => {
      await mutation.mutateAsync(value);
      utils.batEnr.admin.getAdminComment.setData({ demandId }, { admin_comment: value.comment.trim() });
    }),
  });
  return (
    <Form form={form}>
      <form.AppField name="comment">{(field) => <field.TextareaField label="Commentaire interne" />}</form.AppField>
      <form.SubmitButton>Enregistrer le commentaire</form.SubmitButton>
    </Form>
  );
}
