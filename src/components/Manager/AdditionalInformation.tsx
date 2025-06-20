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
  simpleField,
}: {
  demand: Demand;
  field: 'Conso' | 'Logement' | 'Surface en m2' | 'Distance au réseau' | 'Affecté à';
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
  type: 'number' | 'text';
  width?: number;
  /**
   * Do not use the Gestionnaire prefix for the field name
   */
  simpleField?: boolean;
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (demand && value === '') {
      if (!simpleField && field !== 'Surface en m2' && demand[`Gestionnaire ${field}`] !== undefined) {
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
            [simpleField ? field : getFieldName(field)]: type === 'number' ? parseFloat(e.target.value) : e.target.value,
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
            demand[simpleField ? field : getFieldName(field)] = type === 'number' ? parseFloat(e.target.value) : e.target.value;
            setValue(e.target.value);
            onChangeHandler(e);
          },
        }}
      />
    </Container>
  );
};

export default AdditionalInformation;
