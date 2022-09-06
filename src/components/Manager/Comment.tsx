import { useServices } from 'src/services';
import { Demand } from 'src/types/Summary/Demand';
import { TextAreaInput } from './Comment.styles';

const Comment = ({ demand }: { demand: Demand }) => {
  const { demandsService } = useServices();

  return (
    <TextAreaInput
      type="text"
      textarea
      defaultValue={demand.Commentaire}
      onChange={(e) =>
        demandsService.updateDemand(demand.id, {
          Commentaire: e.target.value,
        })
      }
    />
  );
};

export default Comment;
