import { useForm } from '@components/form/react-hook-form/useForm';
import React from 'react';
import { communes } from 'src/services/simulateur/communes';
import { departements } from 'src/services/simulateur/departements';
import { SimulatorSchemaType, simulatorSchema } from './validation';

type SimulatorFormProps = Omit<
  React.HTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  onSubmit: (data: SimulatorSchemaType) => any;
};

const SimulatorForm: React.FC<SimulatorFormProps> = ({
  children,
  className,
  onSubmit: onExternalSubmit,
  ...props
}) => {
  const { watch, Form, resetField, Input, Radio, TextArea, Toggle, Select } =
    useForm<SimulatorSchemaType>({
      schema: simulatorSchema,
      defaultValues: {
        departement: '59',
      },
    });
  const onSubmit: React.ComponentProps<typeof Form>['onSubmit'] = (values) => {
    onExternalSubmit(values);
  };

  const departmentId = watch('departement');

  return (
    <Form className={className} onSubmit={onSubmit} {...props}>
      <Toggle
        name="mode_pro"
        label="Mode pro"
        labelPosition="left"
        showCheckedHint={false}
      />
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
      <Input
        rules={{ required: true }}
        name="adresse"
        label="Entrez votre adresse"
        hintText="Plus que 5 caractères"
      />
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
      <input type="submit" value="Envoyer" />
    </Form>
  );
};

export default SimulatorForm;
