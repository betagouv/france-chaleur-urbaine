import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import TextArea from '@/components/form/dsfr/TextArea';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import debounce from '@/utils/debounce';

type InternalCommentFieldProps = {
  requestId: string;
  /** stored note, used as the initial value (the component is remounted for each request by its parent's key) */
  initialValue: string | null;
};

/**
 * Follow-up note of the admins on a request, saved automatically while typing (same pattern as the demands comments),
 * and flushed on blur and when the dialog closes so a pause is never required. Never shown to the submitter.
 */
function InternalCommentField({ requestId, initialValue }: InternalCommentFieldProps) {
  const [value, setValue] = useState(initialValue ?? '');
  const utils = trpc.useUtils();
  const updateInternalComment = trpc.networkChangeRequests.admin.updateInternalComment.useMutation();
  // what the server holds vs what is typed: a flush only sends when they differ
  const savedValueRef = useRef(initialValue ?? '');
  const typedValueRef = useRef(value);
  const persist = useMemo(
    () =>
      toastErrors(async (internalComment: string) => {
        savedValueRef.current = internalComment;
        await updateInternalComment.mutateAsync({ id: requestId, internalComment });
        await utils.networkChangeRequests.admin.list.invalidate();
      }),
    [requestId, updateInternalComment.mutateAsync, utils]
  );
  const debouncedPersist = useMemo(() => debounce(persist, 800), [persist]);
  const flush = () => {
    debouncedPersist.cancel();
    if (typedValueRef.current !== savedValueRef.current) {
      void persist(typedValueRef.current);
    }
  };
  // closing the dialog (button or Escape) must not lose the text typed during the last 800 ms
  useEffect(() => flush, [debouncedPersist]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    typedValueRef.current = event.target.value;
    debouncedPersist(event.target.value);
  };

  return (
    <TextArea
      label=""
      hideOptionalLabel
      size="sm"
      hintText="Visible uniquement par l'équipe FCU, enregistré automatiquement"
      state={updateInternalComment.isError ? 'error' : 'default'}
      stateRelatedMessage={updateInternalComment.isError ? 'Enregistrement impossible, réessayez' : undefined}
      nativeTextAreaProps={{
        'aria-label': 'Commentaire interne',
        onBlur: flush,
        onChange: handleChange,
        rows: 3,
        value,
      }}
    />
  );
}

export default InternalCommentField;
