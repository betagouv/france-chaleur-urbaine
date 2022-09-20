import { TextInput } from '@dataesr/react-dsfr';
import debounce from '@utils/debounce';
import { useEffect, useMemo, useState } from 'react';
import { Demand } from 'src/types/Summary/Demand';
import { Container } from './AdditionalInformation.styles';

const AdditionalInformation = ({
  demand,
  field,
  updateDemand,
}: {
  demand: Demand;
  field: 'Conso' | 'Logement' | 'Distance au réseau';
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
}) => {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (demand && value === '') {
      if (demand[`Gestionnaire ${field}`] !== undefined) {
        setValue(demand[`Gestionnaire ${field}`].toString());
      } else if (demand[field]) {
        setValue(demand[field].toString());
      }
    }
  }, [demand, field]);

  const onChangeHandler = useMemo(
    () =>
      debounce(
        (e) =>
          updateDemand(demand.id, {
            [`Gestionnaire ${field}`]: parseFloat(e.target.value),
          }),
        500
      ),
    [demand.id, updateDemand, field]
  );

  useEffect(() => () => onChangeHandler.cancel(), [onChangeHandler]);

  return (
    <Container>
      <TextInput
        type="number"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChangeHandler(e);
        }}
      />
    </Container>
  );
};

export default AdditionalInformation;
