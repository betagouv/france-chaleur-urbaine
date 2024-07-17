import Input from '@components/form/Input';
import debounce from '@utils/debounce';
import { useEffect, useMemo, useState } from 'react';
import { Demand } from 'src/types/Summary/Demand';
import { Container } from './AdditionalInformation.styles';

const AdditionalInformation = ({
  demand,
  field,
  updateDemand,
  type,
  width,
}: {
  demand: Demand;
  field: 'Conso' | 'Logement' | 'Distance au réseau' | 'Affecté à';
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
  type: 'number' | 'text';
  width?: number;
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
  }, [demand, field, value]);

  const onChangeHandler = useMemo(
    () =>
      debounce(
        (e) =>
          updateDemand(demand.id, {
            [`Gestionnaire ${field}`]:
              type === 'number' ? parseFloat(e.target.value) : e.target.value,
          }),
        500
      ),
    [demand.id, updateDemand, field, type]
  );

  useEffect(() => () => onChangeHandler.cancel(), [onChangeHandler]);

  return (
    <Container width={width}>
      <Input
        label=""
        nativeInputProps={{
          type: type,
          value: value,
          onChange: (e) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: force type
            demand[`Gestionnaire ${field}`] =
              type === 'number' ? parseFloat(e.target.value) : e.target.value;
            setValue(e.target.value);
            onChangeHandler(e);
          },
        }}
      />
    </Container>
  );
};

export default AdditionalInformation;
