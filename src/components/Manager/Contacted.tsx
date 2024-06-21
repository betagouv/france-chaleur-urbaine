import { Demand } from 'src/types/Summary/Demand';
import { Checkbox } from './Contacted.styles';

const Contacted = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
}) => {
  const handleCheckboxChange = (e: any) => {
    updateDemand(demand.id, {
      'Prise de contact': e.target.checked,
    });
  };

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: to fix in react-dsfr
    <Checkbox
      small
      options={[
        {
          label: '',
          nativeInputProps: {
            value: 'Prise de contact',
            defaultChecked: demand['Prise de contact'],
            onChange: handleCheckboxChange,
          },
        },
      ]}
    ></Checkbox>
  );
};

export default Contacted;
