import { useEffect, useRef } from 'react';
import { Demand } from 'src/types/Summary/Demand';
import { TextAreaInput } from './Comment.styles';

const Comment = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <TextAreaInput
      type="text"
      textarea
      defaultValue={demand.Commentaire}
      onChange={(e) => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () =>
            updateDemand(demand.id, {
              Commentaire: e.target.value,
            }),
          500
        );
      }}
    />
  );
};

export default Comment;
