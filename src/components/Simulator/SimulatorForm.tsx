import React from 'react';

import AutocompleteInput from '@components/form/dsfr/AutocompleteInput';
import { useForm } from '@components/form/react-hook-form/useForm';
import { useServices } from 'src/services';

import { SimulatorSchemaType, simulatorSchema } from './validation';

type SimulatorFormProps = Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit: (data: SimulatorSchemaType) => any;
};

const SimulatorForm: React.FC<SimulatorFormProps> = ({ children, className, onSubmit: onExternalSubmit, ...props }) => {
  const { setValue, Form, Input, Radio, TextArea, Toggle, Select, Checkboxes, Checkbox } = useForm<SimulatorSchemaType>({
    schema: simulatorSchema,
    defaultValues: {
      departement: '59',
    },
    onChange: ({ values }) => {
      // debug form values
      onExternalSubmit(values as any);
    },
  });
  const [address, setAddress] = React.useState<Awaited<ReturnType<typeof fetchOptions>>[number]>();
  const { suggestionService } = useServices();
  const onSubmit: React.ComponentProps<typeof Form>['onSubmit'] = (values) => {
    onExternalSubmit(values);
  };

  const fetchOptions = async (query: string) => {
    const suggestions = await suggestionService.fetchSuggestions(query, { limit: '10' });

    return suggestions.features;
  };

  return (
    <Form className={className} onSubmit={onSubmit} {...props}>
      <Toggle name="mode_pro" label="Mode pro" labelPosition="left" showCheckedHint={false} />

      <AutocompleteInput
        fetchFn={fetchOptions}
        label={"Autocomplete de l'adresse"}
        onSelect={(address) => {
          setAddress(address);
          setValue('commune', address.properties.postcode);
          setValue('departement', address.properties.postcode.slice(0, 2));
        }}
        getOptionValue={(option) => option.properties.label}
        onClear={() => setAddress(undefined)}
        nativeInputProps={{
          placeholder: 'Tapez ici votre adresse',
        }}
      />
      <pre>{JSON.stringify(address, null, 2)}</pre>

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
        options={[
          {
            label: 'DPE 1',
            value: 'dpe-1',
          },
        ]}
        name="dpe"
        label="DPE (ou année de construction ou norme thermique)"
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
