import { faker } from '@faker-js/faker/locale/fr';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import Carrousel from './Carrousel';

const testimonies = [
  {
    autor: {
      longName: 'M. Brunet',
      role: 'président du Conseil Syndical',
      mansion: 'Résidence du château',
      place: 'Chelles',
    },
    testimony:
      'Nous apprécions d’avoir supprimé notre chaufferie fioul au profit d’une solution de chauffage écologique et efficace qui est mature et nous évite les problèmes d’entretien de chaudière et de gestion des stocks de fioul, le tout avec une grande sérénité vis-à-vis de la sécurité.',
  },
  {
    autor: {
      longName: 'M. Maury',
      role: 'président de conseil syndical',
      mansion: 'Le Prieuré',
      place: 'Fresnes',
    },
    testimony:
      'Grâce à notre raccordement au réseau géothermique, nous sommes fiers de contribuer à notre niveau à la transition énergétique. Nous apprécions le service apporté par l’exploitant du réseau depuis près de 20 ans déjà.',
  },
  {
    autor: {
      longName: 'M. Sauvagère',
      role: 'président du conseil syndical',
      mansion: 'La Fresnais',
      place: 'Fresnes',
    },
    testimony:
      "Le raccordement au réseau de Fresnes permet de nous chauffer avec une énergie renouvelable avec une facture maîtrisée dans le temps. De plus, les techniciens du réseau sont particulièrement performants ce qui nous évite les soucis liés à l'entretien.",
  },
  {
    autor: {
      longName: 'M. Pierrot',
      role: 'membre du conseil syndical',
      mansion: 'les Peupliers',
      place: 'Le Mée sur Seine',
    },
    testimony:
      'Belle satisfaction pour un confort thermique inégalé, aucun problème technique, correspondants CGCU compétents et disponibles. Confiance totale à ce jour et promesses tenues sur l’ensemble du dossier.',
  },
];

const getFakeTestimony = () => ({
  autor: {
    longName: faker.name.findName(),
    role: faker.name.jobType(),
    mansion: `Résidence ${faker.word.adjective()}`,
    place: `${faker.commerce.productName()} : ${faker.commerce.department()} - ${faker.address.cityName()}`,
  },
  //   testimony: faker.lorem.paragraph(),
  testimony: faker.commerce.productDescription(),
});
const uniqueName = faker.unique(faker.name.firstName);
const fakeData = new Array(5).fill('').map(getFakeTestimony);

export default {
  title: 'Design System/Composants/Carrousel',
  component: Carrousel,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Carrousel>;

const Template: ComponentStory<typeof Carrousel> = (args) => (
  <Carrousel {...args} />
);

export const Primary = Template.bind({});
Primary.storyName = 'Temoignages';
Primary.args = {
  title: 'Leur copropriété est raccordée - ils témoignent :',
  Testimonies: testimonies,
  imgSrc: './img/home-testimony.jpg',
  imgAlt: 'Portrait d’Isham et Sophie.',
};

export const Secondary = Template.bind({});
Secondary.storyName = 'Texte auto généré';
Secondary.args = {
  title: uniqueName,
  Testimonies: fakeData,
  imgSrc: 'https://dummyimage.com/640x360/eee/aaa',
  imgAlt: 'Placeholder image',
};
