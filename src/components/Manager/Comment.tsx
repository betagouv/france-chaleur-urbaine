import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import TextAreaInput from '@/components/form/dsfr/TextArea';
import { type Demand } from '@/types/Summary/Demand';
import debounce from '@/utils/debounce';

const Comment = ({
  demand,
  field,
  updateDemand,
}: {
  demand: Demand;
  field: 'Commentaire' | 'Commentaires_internes_FCU';
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const [value, setValue] = useState(demand[field]);

  const debouncedUpdateDemand = useMemo(
    () =>
      debounce(
        (value: string) =>
          updateDemand(demand.id, {
            [field]: value,
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
      className="w-full [&>textarea]:!leading-4"
      nativeTextAreaProps={{
        value,
        onChange: onChangeHandler,
      }}
    />
  );
};

export default Comment;
