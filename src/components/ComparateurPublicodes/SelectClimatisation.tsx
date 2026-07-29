import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import type React from 'react';

import { usePublicodesFormContext } from '@/components/form/publicodes/FormProvider';

export type SelectClimatisation = Omit<React.ComponentProps<typeof Select>, 'label' | 'options' | 'nativeSelectProps'>;

const SelectClimatisation = ({ ...props }: SelectClimatisation) => {
  const { engine } = usePublicodesFormContext();
  const inclureLaClimatisation = engine.getField('climatisation . incluse');
  const typeDeProductionDeFroid = engine.getField('climatisation . type de production');

  return (
    <Select
      label="climatisation . incluse"
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
        onChange: (e) => {
          const newValue = e.target.value;
          if (newValue === 'non') {
            engine.resetField('climatisation . incluse');
            engine.resetField('climatisation . type de production');
            return;
          }

          engine.setField('climatisation . incluse', 'oui');
          engine.setStringField('climatisation . type de production', newValue === 'groupe-froid' ? 'Groupe froid' : 'Réseau de froid');
        },
        value: !inclureLaClimatisation ? 'non' : typeDeProductionDeFroid === 'Groupe froid' ? 'groupe-froid' : 'reseau-de-froid',
      }}
      {...props}
    />
  );
};

export default SelectClimatisation;
