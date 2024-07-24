import React from 'react';

import { useForm } from '@components/form/react-hook-form/useForm';
import { communes } from 'src/services/simulateur/communes';
import { departements } from 'src/services/simulateur/departements';

import { SimulatorSchemaType, simulatorSchema } from './validation';

type SimulatorFormProps = Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit: (data: SimulatorSchemaType) => any;
};

const SimulatorForm: React.FC<SimulatorFormProps> = ({ children, className, onSubmit: onExternalSubmit, ...props }) => {
  const { watch, Form, resetField, Input, Radio, TextArea, Toggle, Select, Checkboxes, Checkbox } = useForm<SimulatorSchemaType>({
    schema: simulatorSchema,
    defaultValues: {
      departement: '59',
    },
    onChange: ({ values }) => {
      // debug form values
      onExternalSubmit(values as any);
    },
  });
  const onSubmit: React.ComponentProps<typeof Form>['onSubmit'] = (values) => {
    onExternalSubmit(values);
  };

  const departmentId = watch('departement');

  return (
    <Form className={className} onSubmit={onSubmit} {...props}>
      <Toggle name="mode_pro" label="Mode pro" labelPosition="left" showCheckedHint={false} />

      <Radio
        rules={{ required: true }}
        name="type_batiment"
        orientation="horizontal"
        options={[
          {
            label: 'Résidentiel',
            value: 'residentiel',
          },
          {
            label: 'Tertiaire',
            value: 'tertiaire',
          },
        ]}
      />
      <Input rules={{ required: true }} name="adresse" label="Entrez votre adresse" hintText="Plus que 5 caractères" />
      <TextArea name="description" label="Entrez une description" />
      <Select
        options={departements.map((d) => ({
          label: `${d.nom} (${d.codeDepartement})`,
          value: d.codeDepartement,
        }))}
        onChange={() => {
          resetField('commune');
        }}
        name="departement"
        label="Département"
        hintText="Essayez avec 64, 55, 59, 31 pour avoir une commune"
      />
      <Select
        options={communes
          .filter((c) => c.codeDepartement === departmentId)
          .map((d) => ({
            label: d.nom,
            value: d.codeInsee,
          }))}
        name="commune"
        label="Commune"
      />

      <Select
        options={[
          {
            label: 'DPE 1',
            value: 'dpe-1',
          },
        ]}
        name="dpe"
        label="DPE (ou année de construction ou norme thermique)"
      />
      <Checkboxes
        name="services_supplementaires"
        options={[
          {
            label: 'Inclure l’eau chaude',
            value: 'eau_chaude',
          },
          {
            label: 'Inclure la climatisation',
            value: 'climatisation',
          },
        ]}
      />
      <Checkbox name="terms" legend="Terms" label="J’accepte les conditions d’utilisation" hintText="Mais lisez les avant" />
      <input type="submit" value="Envoyer" />
    </Form>
  );
};

export default SimulatorForm;
