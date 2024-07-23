import rules, { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useForm } from '@components/form/react-hook-form/useForm';
import React from 'react';
import usePublicodesEngine from './usePublicodesEngine';
import {
  PublicodeSimulatorSchemaType,
  publicodesSimulatorSchema,
} from './validation';

type SimulatorFormProps = Omit<
  React.HTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  onSubmit: (data: PublicodeSimulatorSchemaType) => any;
};

const SimulatorForm: React.FC<SimulatorFormProps> = ({
  children,
  className,
  onSubmit: onExternalSubmit,
  ...props
}) => {
  const { setField, getField } = usePublicodesEngine<DottedName>(rules);

  const { Form, Input } = useForm<PublicodeSimulatorSchemaType>({
    schema: publicodesSimulatorSchema,
    defaultValues: {},
    mode: 'onChange',
    onChange: ({ changed }) => {
      changed?.forEach(({ path, value }) => {
        setField(path as DottedName, value);
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
          placeholder: `${getField('taille') ?? ''}`,
        }}
      />
      <Input
        name="poids"
        label="Quel est votre poids (en kg) ?"
        nativeInputProps={{
          placeholder: `${getField('poids') ?? ''}`,
        }}
      />
      <div>IMC = {getField('résultat')}</div>
      <div>Interprêtation = {getField('résultat . interpretation')}</div>
    </Form>
  );
};

export default SimulatorForm;
