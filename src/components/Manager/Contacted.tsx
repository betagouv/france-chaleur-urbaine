import { Demand } from 'src/types/Summary/Demand';
import { Checkbox } from './Contacted.styles';

const Contacted = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
}) => {
  return (
    <Checkbox
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: to fix in react-dsfr
      defaultChecked={demand['Prise de contact']}
      onChange={(e: any) =>
        updateDemand(demand.id, {
          'Prise de contact': e.target.checked,
        })
      }
    ></Checkbox>
  );
};

export default Contacted;
