import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { type Demand } from '@/types/Summary/Demand';
import debounce from '@/utils/debounce';

import { TextAreaInput } from './Comment.styles';

const Comment = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const [value, setValue] = useState(demand.Commentaire);

  const debouncedUpdateDemand = useMemo(
    () =>
      debounce(
        (value: string) =>
          updateDemand(demand.id, {
            Commentaire: value,
          }),
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
      nativeTextAreaProps={{
        value,
        onChange: onChangeHandler,
      }}
    />
  );
};

export default Comment;
