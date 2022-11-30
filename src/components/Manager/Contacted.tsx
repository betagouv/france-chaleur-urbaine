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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: to fix in react-dsfr
    <Checkbox
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
