import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import TextAreaInput from '@/components/form/dsfr/TextArea';
import debounce from '@/utils/debounce';
import type { Demand } from '../types';

const Comment = <T extends Demand>({
  demand,
  field,
  updateDemand,
}: {
  demand: T;
  field: 'comment_gestionnaire' | 'comment_fcu';
  updateDemand: (demandId: string, demand: Partial<T>) => Promise<void>;
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
      size="sm"
      className="w-full [&>textarea]:leading-4!"
      nativeTextAreaProps={{
        onChange: onChangeHandler,
        value,
      }}
    />
  );
};

export default Comment;
