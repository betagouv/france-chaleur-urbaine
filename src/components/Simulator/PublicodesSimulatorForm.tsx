import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import React from 'react';

import { useForm } from '@components/form/react-hook-form/useForm';

import useSimulatorEngine from './useSimulatorEngine';
import { PublicodeSimulatorSchemaType, publicodesSimulatorSchema } from './validation';

type SimulatorFormProps = Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit: (data: PublicodeSimulatorSchemaType) => any;
  engine: ReturnType<typeof useSimulatorEngine>;
};

const SimulatorForm: React.FC<SimulatorFormProps> = ({ children, className, engine, onSubmit: onExternalSubmit, ...props }) => {
  const { Form, Input } = useForm<PublicodeSimulatorSchemaType>({
    schema: publicodesSimulatorSchema,
    defaultValues: {},
    onChange: ({ changed }) => {
      changed?.forEach(({ path, value }) => {
        engine.setField(path as DottedName, value);
      });
    },
  });
  const onSubmit: React.ComponentProps<typeof Form>['onSubmit'] = (values) => {
    onExternalSubmit(values);
  };

  return (
    <Form className={className} onSubmit={onSubmit} {...props}>
      <Input
        name="taille"
        label="Quelle est votre taille (en cm) ?"
        nativeInputProps={{
          placeholder: `${engine.getField('taille') ?? ''}`,
        }}
      />
      <Input
        name="poids"
        label="Quel est votre poids (en kg) ?"
        nativeInputProps={{
          placeholder: `${engine.getField('poids') ?? ''}`,
        }}
      />
      <div>IMC = {engine.getField('résultat')}</div>
      <div>Interprêtation = {engine.getField('résultat . interpretation')}</div>
    </Form>
  );
};

export default SimulatorForm;
