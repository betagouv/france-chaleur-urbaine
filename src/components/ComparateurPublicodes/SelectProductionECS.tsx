import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import { usePublicodesFormContext } from '@components/form/publicodes/FormProvider';
import Label from '@components/form/publicodes/Label';

export type SelectProductionECS = Omit<React.ComponentProps<typeof Select>, 'label' | 'options' | 'nativeSelectProps'>;

const SelectProductionECS = ({ ...props }: SelectProductionECS) => {
  const { engine } = usePublicodesFormContext();
  const inclureProdECS = engine.getField('Production eau chaude sanitaire');
  const typeDeProductionECS = engine.getField('type de production ECS');
  return (
    <Select
      label={
        <Label
          label={"Inclure la production d'eau chaude sanitaire"}
          help={
            <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
              <li>
                <strong>"Non"</strong> implique que la consommation d'eau chaude sanitaire n'est pas à inclure dans la simulation.
              </li>
              <li>
                <strong>"Avec équipement de chauffage"</strong> signifie que l'eau chaude sanitaire est produite à partir du même équipement
                que le chauffage.
              </li>
              <li>
                <strong>"Chauffe-eau électrique"</strong> signifie que pour tous les modes de chauffage, l'eau chaude sanitaire sera
                produite avec un chauffe-eau électrique.
              </li>
            </ul>
          }
        />
      }
      options={[
        {
          label: 'Non',
          value: 'non',
        },
        {
          label: 'Avec équipement chauffage',
          value: 'equipement-chauffage',
        },
        {
          label: 'Chauffe-eau électrique',
          value: 'chauffe-eau-electrique',
        },
        {
          label: 'Solaire thermique',
          value: 'solaire-thermique',
        },
      ]}
      nativeSelectProps={{
        value: !inclureProdECS
          ? 'non'
          : typeDeProductionECS === 'Avec équipement chauffage'
          ? 'equipement-chauffage'
          : typeDeProductionECS === 'Chauffe-eau électrique'
          ? 'chauffe-eau-electrique'
          : 'solaire-thermique',
        onChange: (e) => {
          const newValue = e.target.value;
          engine.setField('Production eau chaude sanitaire', newValue === 'non' ? 'non' : 'oui');
          engine.setStringField(
            'type de production ECS',
            newValue === 'equipement-chauffage'
              ? 'Avec équipement chauffage'
              : newValue === 'chauffe-eau-electrique'
              ? 'Chauffe-eau électrique'
              : 'Solaire thermique'
          );
        },
      }}
      {...props}
    />
  );
};

export default SelectProductionECS;
