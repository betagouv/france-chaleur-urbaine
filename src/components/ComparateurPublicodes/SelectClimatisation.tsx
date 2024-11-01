import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import { usePublicodesFormContext } from '@components/form/publicodes/FormProvider';

export type SelectClimatisation = Omit<React.ComponentProps<typeof Select>, 'label' | 'options' | 'nativeSelectProps'>;

const SelectClimatisation = ({ ...props }: SelectClimatisation) => {
  const { engine } = usePublicodesFormContext();
  const inclureLaClimatisation = engine.getField('Inclure la climatisation');
  const typeDeProductionDeFroid = engine.getField('type de production de froid');

  return (
    <Select
      label="Inclure la climatisation"
      options={[
        {
          label: 'Non',
          value: 'non',
        },
        {
          label: 'Avec un groupe froid (climatisation)',
          value: 'groupe-froid',
        },
        {
          label: 'Avec un réseau de froid',
          value: 'reseau-de-froid',
        },
      ]}
      nativeSelectProps={{
        value: !inclureLaClimatisation ? 'non' : typeDeProductionDeFroid === 'Groupe froid' ? 'groupe-froid' : 'reseau-de-froid',
        onChange: (e) => {
          const newValue = e.target.value;
          engine.setField('Inclure la climatisation', newValue === 'non' ? 'non' : 'oui');
          engine.setStringField('type de production de froid', newValue === 'groupe-froid' ? 'Groupe froid' : 'Réseau de froid');
        },
      }}
      {...props}
    />
  );
};

export default SelectClimatisation;
