import type { Demand } from '@/types/Summary/Demand';

import { Checkbox } from './Contacted.styles';

const Contacted = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const handleCheckboxChange = (e: any) => {
    void updateDemand(demand.id, {
      'Prise de contact': e.target.checked,
    });
  };

  return (
    <Checkbox
      options={[
        {
          label: '',
          nativeInputProps: {
            defaultChecked: demand['Prise de contact'],
            onChange: handleCheckboxChange,
            value: 'Prise de contact',
          },
        },
      ]}
    />
  );
};

export default Contacted;
