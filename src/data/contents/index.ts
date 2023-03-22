import { Article } from 'src/types/Article';
import readme from './README.md';
import seChaufferAPrixStables from './se-chauffer-a-prix-stables.md';
import unPlanNationalDactionPourLaGeothermie from './un-plan-national-daction-pour-la-geothermie.md';

const importFile = (file: string) => {
  return file.replace('(.gitbook/assets/', '(/contents/');
};

export const articles: Article[] = [
  {
    slug: 'une-obligation-de-raccordement-pour-certains-bâtiments',
    title: 'Une obligation de raccordement pour certains bâtiments ?',
    image: '/contents/FCU_Infographie_classement.jpg',
    content: importFile(readme),
  },
  {
    slug: 'un-plan-national-daction-pour-la-geothermie',
    title: "Un plan national d'action pour la géothermie",
    image: '/contents/2023-03-22 13_44_43-02.02.2023_DP_Geothermie.pdf.png',
    content: importFile(unPlanNationalDactionPourLaGeothermie),
  },
  {
    slug: 'se-chauffer-a-prix-stables',
    title: 'Se chauffer à prix stables',
    image: '/contents/comparaison_evo_prix.jpg',
    content: importFile(seChaufferAPrixStables),
  },
];

export const getArticle = (slug: string) =>
  articles.find((article) => article.slug === slug);
