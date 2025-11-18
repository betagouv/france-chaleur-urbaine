import Checkbox from '@/components/form/dsfr/Checkbox';
import type { Demand } from '@/modules/demands/types';

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
      label=""
      nativeInputProps={{
        defaultChecked: demand['Prise de contact'],
        name: 'prise_de_contact',
        onChange: handleCheckboxChange,
      }}
    />
  );
};

export default Contacted;
