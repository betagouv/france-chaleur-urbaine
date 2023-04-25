import { Article } from 'src/types/Article';
import reseauxACreerOuEtendre from './1600-reseaux-a-creer-ou-etendre.md';
import reseauxDeChaleurClasses from './636-reseaux-de-chaleur-classes.md';
import readme_1_1 from './README (1) (1).md';
import readme_1 from './README (1).md';
import readme from './README.md';
import dossierSpecialSurLesReseauxDeChaleur from './dossier-special-sur-les-reseaux-de-chaleur.md';
import faisonsConnaitreLeChauffageUrbain from './faisons-connaitre-le-chauffage-urbain.md';
import franceChaleurUrbaineSeConstruitAvecSesUsagers from './france-chaleur-urbaine-se-construit-avec-ses-usagers.md';
import lappelAProjets1Ville1ReseauDeLademeEstRelance from './lappel-a-projets-1-ville-1-reseau-de-lademe-est-relance.md';
import leChauffageLePlusEconomiquePourLhabitatCollectif from './le-chauffage-le-plus-economique-pour-lhabitat-collectif.md';
import leChauffageUrbainDansLaPresse from './le-chauffage-urbain-dans-la-presse.md';
import leChauffageUrbainPourLesBatimentsTertiairesUnContexteOnNePeutPlusFavorable from './le-chauffage-urbain-pour-les-batiments-tertiaires-un-contexte-on-ne-peut-plus-favorable.md';
import lesSyndicsEtFranceChaleurUrbaine from './les-syndics-et-france-chaleur-urbaine.md';
import page_2 from './page-2.md';
import seChaufferAPrixStables from './se-chauffer-a-prix-stables.md';
import unPlanNationalDactionPourLaGeothermie from './un-plan-national-daction-pour-la-geothermie.md';

const importFile = (file: string) => {
  return file.replaceAll('.gitbook/assets/', '/contents/');
};

export const articles: Article[] = [
  {
    image: '/contents/16.jpg',
    title: 'Les ménages français et le chauffage',
    slug: 'les-ménages-français-et-le-chauffage',
    content: importFile(readme),
  },
  {
    image: '/contents/15.jpg',
    title: 'La décarbonation des réseaux de chaleur est en marche !',
    slug: 'la-décarbonation-des-réseaux-de-chaleur-est-en-marche',
    content: importFile(readme_1),
  },
  {
    image: '/contents/08.jpg',
    title: "L'appel à projets 1 ville 1 réseau de l'ADEME est relancé",
    slug: 'l-appel-à-projets-1-ville-1-réseau-de-l-ademe-est-relancé',
    content: importFile(lappelAProjets1Ville1ReseauDeLademeEstRelance),
  },
  {
    image: '/contents/09.jpg',
    title: '1600 réseaux à créer ou étendre',
    slug: '1600-réseaux-à-créer-ou-étendre',
    content: importFile(reseauxACreerOuEtendre),
  },
  {
    image: '/contents/avion.jpg',
    title: "6,63 millions d'allers-retours Paris New-York évités",
    slug: '6-63-millions-d-allers-retours-paris-new-york-évités',
    content: importFile(readme_1_1),
  },
  {
    image: '/contents/14 (1).jpg',
    title: 'France Chaleur Urbaine se construit avec ses usagers',
    slug: 'france-chaleur-urbaine-se-construit-avec-ses-usagers',
    content: importFile(franceChaleurUrbaineSeConstruitAvecSesUsagers),
  },
  {
    image: '/contents/02.jpg',
    title: 'Une obligation de raccordement pour certains bâtiments',
    slug: 'une-obligation-de-raccordement-pour-certains-bâtiments',
    content: importFile(page_2),
  },
  {
    image: '/contents/11.jpg',
    title:
      'Le chauffage urbain pour les bâtiments tertiaires : un contexte on ne peut plus favorable !',
    slug: 'le-chauffage-urbain-pour-les-bâtiments-tertiaires-un-contexte-on-ne-peut-plus-favorable',
    content: importFile(
      leChauffageUrbainPourLesBatimentsTertiairesUnContexteOnNePeutPlusFavorable
    ),
  },
  {
    image: '/contents/03.jpg',
    title: "Le chauffage le plus économique pour l'habitat collectif",
    slug: 'le-chauffage-le-plus-économique-pour-l-habitat-collectif',
    content: importFile(leChauffageLePlusEconomiquePourLhabitatCollectif),
  },
  {
    image: '/contents/04.jpg',
    title: 'Faisons connaître le chauffage urbain !',
    slug: 'faisons-connaître-le-chauffage-urbain',
    content: importFile(faisonsConnaitreLeChauffageUrbain),
  },
  {
    image: '/contents/10.jpg',
    title: 'Se chauffer à prix stables',
    slug: 'se-chauffer-à-prix-stables',
    content: importFile(seChaufferAPrixStables),
  },
  {
    image: '/contents/12.jpg',
    title: 'Le chauffage urbain dans la presse',
    slug: 'le-chauffage-urbain-dans-la-presse',
    content: importFile(leChauffageUrbainDansLaPresse),
  },
  {
    image: '/contents/05.jpg',
    title: "Un plan national d'action pour la géothermie",
    slug: 'un-plan-national-d-action-pour-la-géothermie',
    content: importFile(unPlanNationalDactionPourLaGeothermie),
  },
  {
    image: '/contents/06.jpg',
    title: 'Dossier spécial sur les réseaux de chaleur',
    slug: 'dossier-spécial-sur-les-réseaux-de-chaleur',
    content: importFile(dossierSpecialSurLesReseauxDeChaleur),
  },
  {
    image: '/contents/07.jpg',
    title: '636 réseaux de chaleur classés',
    slug: '636-réseaux-de-chaleur-classés',
    content: importFile(reseauxDeChaleurClasses),
  },
  {
    image: '/contents/13.jpg',
    title: 'Les syndics et France Chaleur Urbaine',
    slug: 'les-syndics-et-france-chaleur-urbaine',
    content: importFile(lesSyndicsEtFranceChaleurUrbaine),
  },
];

export const getArticle = (slug: string) =>
  articles.find((article) => article.slug === slug);
