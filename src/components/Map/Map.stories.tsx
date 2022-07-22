import { ComponentMeta, ComponentStory } from '@storybook/react';
import Map from './Map';

export default {
  title: 'Design System/Composants/Map',
  component: Map,
} as ComponentMeta<typeof Map>;

const Template: ComponentStory<typeof Map> = () => <Map />;

export const Primary = Template.bind({});
Primary.storyName = 'Exemple';
