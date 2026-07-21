import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import TextAreaInput from '@/components/form/dsfr/TextArea';
import debounce from '@/utils/debounce';

import type { Demand } from '../types';

const Comment = <T extends Demand>({
  demand,
  field,
  updateDemand,
  disabled = false,
}: {
  demand: T;
  field: 'comment_gestionnaire' | 'comment_fcu' | 'comment_user';
  updateDemand: (demandId: string, demand: Partial<T>) => Promise<void>;
  disabled?: boolean;
}) => {
  const [value, setValue] = useState(demand[field]);

  const debouncedUpdateDemand = useMemo(
    () =>
      debounce(
        (value: string) =>
          updateDemand(demand.id, {
            [field]: value,
          } as Partial<T>),
        500
      ),
    [demand.id, updateDemand]
  );

  useEffect(() => () => debouncedUpdateDemand.cancel(), [debouncedUpdateDemand]);

  const onChangeHandler = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setValue(value);
      debouncedUpdateDemand(value);
    },
    [debouncedUpdateDemand]
  );

  return (
    <TextAreaInput
      label=""
      disabled={disabled}
      size="sm"
      className="w-full [&>textarea]:leading-4!"
      nativeTextAreaProps={{
        'aria-label': 'Commentaire',
        onChange: onChangeHandler,
        value: value ?? '',
      }}
    />
  );
};

export default Comment;
