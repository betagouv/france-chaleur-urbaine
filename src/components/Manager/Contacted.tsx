import { type Demand } from '@/types/Summary/Demand';

import { Checkbox } from './Contacted.styles';

const Contacted = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const handleCheckboxChange = (e: any) => {
    updateDemand(demand.id, {
      'Prise de contact': e.target.checked,
    });
  };

  return (
    <Checkbox
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
