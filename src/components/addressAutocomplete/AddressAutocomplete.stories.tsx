import { ComponentMeta, ComponentStory } from '@storybook/react';
import AddressAutocomplete from './AddressAutocomplete';

export default {
  title: 'Design System/Composants/AddressAutocomplete',
  component: AddressAutocomplete,
  argTypes: {
    label: {
      description: 'En-tête du formulaire. (Peut etre composé de neux DOM/JSX)',
      control: 'text',
    },
    emptySuggestionText: { control: 'text' },
    placeholder: { control: 'text' },
    className: { control: 'text' },
    popoverClassName: { control: 'text' },
    centred: { control: 'boolean', default: false },
    onAddressSelected: { table: { disable: true } },
    onChange: { table: { disable: true } },
  },
} as ComponentMeta<typeof AddressAutocomplete>;

const Template: ComponentStory<typeof AddressAutocomplete> = (args) => (
  <AddressAutocomplete {...args} />
);

const defaultProps = {
  label: 'label',
  emptySuggestionText:
    'Aucune adresse ne semble correspondre à cette recherche',
  debounceTime: 200,
  minCharactersLength: 3,
  placeholder: 'placeholder',
  className: '',
  popoverClassName: '',
  centred: false,
};

export const Primary = Template.bind({});
Primary.storyName = 'Exemple';
Primary.args = {
  ...defaultProps,
};
