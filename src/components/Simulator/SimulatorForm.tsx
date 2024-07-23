import { useForm } from '@components/form/react-hook-form/useForm';
import React from 'react';
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
  const { Form, Input, Radio, TextArea, Toggle } = useForm<SimulatorSchemaType>(
    {
      schema: simulatorSchema,
      defaultValues: {},
    }
  );
  const onSubmit: React.ComponentProps<typeof Form>['onSubmit'] = (values) => {
    onExternalSubmit(values);
  };
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

      <input type="submit" value="Envoyer" />
    </Form>
  );
};

export default SimulatorForm;
