import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import debounce from '@utils/debounce';
import { Demand } from 'src/types/Summary/Demand';

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

  useEffect(() => {
    if (demand && value === '') {
      setValue(demand[`Commentaire`]);
    }
  }, [demand, value]);

  return (
    <TextAreaInput
      label=""
      size="sm"
      textArea={true}
      nativeTextAreaProps={{
        value,
        onChange: onChangeHandler,
      }}
    />
  );
};

export default Comment;
