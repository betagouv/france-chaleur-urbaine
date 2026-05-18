import Checkbox from '@/components/form/dsfr/Checkbox';
import type { Demand } from '@/modules/demands/types';

const Contacted = ({
  demand,
  updateDemand,
  disabled = false,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
  disabled?: boolean;
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
        'aria-label': 'Prise de contact',
        defaultChecked: demand['Prise de contact'],
        disabled,
        name: 'prise_de_contact',
        onChange: handleCheckboxChange,
      }}
    />
  );
};

export default Contacted;
