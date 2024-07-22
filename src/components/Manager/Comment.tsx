import { useEffect, useMemo } from 'react';

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
  const onChangeHandler = useMemo(
    () =>
      debounce(
        (e) =>
          updateDemand(demand.id, {
            Commentaire: e.target.value,
          }),
        500
      ),
    [demand.id, updateDemand]
  );

  useEffect(() => () => onChangeHandler.cancel(), [onChangeHandler]);

  return (
    <TextAreaInput
      label=""
      size="sm"
      textArea={true}
      nativeTextAreaProps={{
        value: demand.Commentaire,
        onChange: onChangeHandler,
      }}
    />
  );
};

export default Comment;
