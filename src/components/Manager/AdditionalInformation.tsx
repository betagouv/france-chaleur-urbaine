import { useEffect, useMemo, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import { type Demand } from '@/types/Summary/Demand';
import debounce from '@/utils/debounce';

import { Container } from './AdditionalInformation.styles';

const getFieldName = (field: 'Conso' | 'Logement' | 'Surface en m2' | 'Distance au réseau' | 'Affecté à') =>
  field === 'Surface en m2' ? field : `Gestionnaire ${field}`;

const AdditionalInformation = ({
  demand,
  field,
  updateDemand,
  type,
  width,
}: {
  demand: Demand;
  field: 'Conso' | 'Logement' | 'Surface en m2' | 'Distance au réseau' | 'Affecté à';
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
  type: 'number' | 'text';
  width?: number;
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (demand && value === '') {
      if (field !== 'Surface en m2' && demand[`Gestionnaire ${field}`] !== undefined) {
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
            [getFieldName(field)]: type === 'number' ? parseFloat(e.target.value) : e.target.value,
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
        size="sm"
        nativeInputProps={{
          type: type,
          value: value,
          onChange: (e) => {
            // @ts-expect-error: force type
            demand[getFieldName(field)] = type === 'number' ? parseFloat(e.target.value) : e.target.value;
            setValue(e.target.value);
            onChangeHandler(e);
          },
        }}
      />
    </Container>
  );
};

export default AdditionalInformation;
