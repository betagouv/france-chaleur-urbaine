import { useServices } from 'src/services';
import { Demand } from 'src/types/Summary/Demand';
import { Checkbox } from './Contacted.styles';

const Contacted = ({ demand }: { demand: Demand }) => {
  const { demandsService } = useServices();
  return (
    <Checkbox
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: to fix in react-dsfr
      defaultChecked={demand['Prise de contact']}
      onChange={(e: any) =>
        demandsService.updateDemand(demand.id, {
          'Prise de contact': e.target.checked,
        })
      }
    ></Checkbox>
  );
};

export default Contacted;
