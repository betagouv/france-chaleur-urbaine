import { Demand } from 'src/types/Summary/Demand';
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
      small
      options={[
        {
          label: ' ', // espace important pour afficher le style DSFR https://github.com/codegouvfr/react-dsfr/issues/281#issue-2411226322
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
