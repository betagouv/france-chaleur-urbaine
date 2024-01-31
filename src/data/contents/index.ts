import { Article } from 'src/types/Article';
import readme from './README.md';
import readme_1_1_1_1 from './README (1) (1) (1) (1).md';
import readme_1_1_1 from './README (1) (1) (1).md';
import readme_1_1 from './README (1) (1).md';
import readme_1_2_1 from './README (1) (2) (1).md';
import readme_1_2 from './README (1) (2).md';
import readme_1 from './README (1).md';
import readme_2_1_1 from './README (2) (1) (1).md';
import readme_2_1 from './README (2) (1).md';
import readme_2 from './README (2).md';
import readme_3_1_1_1 from './README (3) (1) (1) (1).md';
import readme_3_1_1 from './README (3) (1) (1).md';
import readme_3_1 from './README (3) (1).md';
import readme_3 from './README (3).md';
import readme_4 from './README (4).md';
import readme_4_1 from './README (4) (1).md';
import readme_5 from './README (5).md';
import readme_6 from './README (6).md';
import readme_7 from './README (7).md';
import readme_8 from './README (8).md';
import readme_9 from './README (9).md';
import readme_10 from './README (10).md';
import readme_11 from './README (11).md';
import readme_12 from './README (12).md';
import readme_13 from './README (13).md';
import readme_14 from './README (14).md';
import readme_15 from './README (15).md';
import readme_16 from './README (16).md';
import readme_17 from './README (17).md';
import demandes from './2000-demandes.md';
import desReseauxVertueux from './des-reseaux-vertueux.md';
import dossierSpecialSurLesReseauxDeChaleur from './dossier-special-sur-les-reseaux-de-chaleur.md';
import faisonsConnaitreLeChauffageUrbain from './faisons-connaitre-le-chauffage-urbain.md';
import franceChaleurUrbaineSeConstruitAvecSesUsagers from './france-chaleur-urbaine-se-construit-avec-ses-usagers.md';
import lappelAProjets1Ville1ReseauDeLademeEstRelance from './lappel-a-projets-1-ville-1-reseau-de-lademe-est-relance.md';
import leChauffageLePlusEconomiquePourLhabitatCollectif from './le-chauffage-le-plus-economique-pour-lhabitat-collectif.md';
import leChauffageUrbainDansLaPresse from './le-chauffage-urbain-dans-la-presse.md';
import leChauffageUrbainPourLesBatimentsTertiairesUnContexteOnNePeutPlusFavorable from './le-chauffage-urbain-pour-les-batiments-tertiaires-un-contexte-on-ne-peut-plus-favorable.md';
import lesReseauxDeChaleurDesEnergiesVertes from './les-reseaux-de-chaleur-des-energies-vertes.md';
import lesReseauxDeChaleurEnMoinsDe15Secondes from './les-reseaux-de-chaleur-en-moins-de-15-secondes.md';
import lesReseauxDeFroidSurNotreCartographie from './les-reseaux-de-froid-sur-notre-cartographie.md';
import lesReseauxLesPlusEcologiquesSontLesPlusEconomiques from './les-reseaux-les-plus-ecologiques-sont-les-plus-economiques.md';
import lesSyndicsEtFranceChaleurUrbaine from './les-syndics-et-france-chaleur-urbaine.md';
import notreCampagneCharlevilleMezieres from './notre-campagne-sur-charleville-mezieres.md';
import notreCampagneFresnes from './notre-campagne-sur-fresnes.md';
import page_2 from './page-2.md';
import potentielsRaccordementTerritoire from './potentiels-de-raccordement-par-territoire.md';
import reseauxACreerOuEtendre from './1600-reseaux-a-creer-ou-etendre.md';
import reseauxDeChaleurClasses from './636-reseaux-de-chaleur-classes.md';
import seChaufferAPrixStables from './se-chauffer-a-prix-stables.md';
import unGuidePourLesExploitants from './un-guide-pour-les-exploitants.md';
import unPlanNationalDactionPourLaGeothermie from './un-plan-national-daction-pour-la-geothermie.md';
import uneEnqueteIfopPourFranceChaleurUrbaine from './une-enquete-ifop-pour-france-chaleur-urbaine.md';
import visiteCentraleFroidAlsaceChaufferieCharras from './visite-de-la-centrale-de-froid-alsace-et-de-la-chaufferie-charras.md';
import visiteDunDatacenter from './visite-dun-datacenter.md';
import visiteDuneChaufferieBiomasse from './visite-dune-chaufferie-biomasse.md';

const importFile = (file: string) => {
  return file.replaceAll('.gitbook/assets/', '/contents/');
};

export const articles: Article[] = [
  {
    image: '/contents/vignett592.jpg',
    title: '592 réseaux classés',
    slug: '592-reseaux-classes',
    content: importFile(readme),
    publishedDate: new Date('2024-01-15'),
  },
  {
    image: '/contents/vignetteochod.jpg',
    title: 'La géothermie expliquée aux enfants',
    slug: 'la-geothermie-expliquee-aux-enfants',
    content: importFile(readme_17),
    publishedDate: new Date('2024-01-09'),
  },
  {
    image: '/contents/vignette2024.jpg',
    title: 'Meilleurs vœux !',
    slug: 'meilleurs-voeux',
    content: importFile(readme_16),
    publishedDate: new Date('2024-01-02'),
  },
  {
    image: '/contents/vignetteFresnes.jpg',
    title: 'Notre campagne sur Fresnes',
    slug: 'notre-campagne-sur-fresnes',
    content: importFile(notreCampagneFresnes),
    publishedDate: new Date('2023-12-28'),
  },
  {
    image: '/contents/vignettepotentiel.jpg',
    title: 'Potentiels de raccordement par territoire',
    slug: 'potentiels-de-raccordement-par-territoire',
    content: importFile(potentielsRaccordementTerritoire),
    publishedDate: new Date('2023-12-21'),
  },
  {
    image: '/contents/vignetteCharleville.jpg',
    title: 'Notre campagne sur Charleville-Mézières',
    slug: 'notre-campagne-sur-charleville-mezieres',
    content: importFile(notreCampagneCharlevilleMezieres),
    publishedDate: new Date('2023-12-19'),
  },
  {
    image: '/contents/vignetterezomee.jpg',
    title:
      "La carte France Chaleur Urbaine sur l'application Rezomee d'ENGIE Solutions",
    slug: 'la-carte-france-chaleur-urbaine-sur-lapplication-rezomee-d-engie-solutions',
    content: importFile(readme_15),
    publishedDate: new Date('2023-12-15'),
  },
  {
    image: '/contents/vignetteCharras.jpg',
    title: 'Visite de la centrale de froid Alsace et de la chaufferie Charras',
    slug: 'visite-de-la-centrale-de-froid-alsace-et-de-la-chaufferie-charras',
    content: importFile(visiteCentraleFroidAlsaceChaufferieCharras),
    publishedDate: new Date('2023-12-13'),
  },
  {
    image: '/contents/friday.jpg',
    title: 'Black Friday, Green Friday',
    slug: 'black-friday-green-friday',
    content: importFile(readme_14),
    publishedDate: new Date('2023-11-24'),
  },
  {
    image: '/contents/Optimiser-vignette.jpg',
    title: 'Optimiser son réseau de chaleur',
    slug: 'optimiser-son-reseau-de-chaleur',
    content: importFile(readme_13),
    publishedDate: new Date('2023-11-14'),
  },
  {
    image: '/contents/enquete2.jpg',
    title: 'Enquête 2023 des réseaux de chaleur et de froid',
    slug: 'enquete-2023-des-reseaux-de-chaleur-et-de-froid',
    content: importFile(readme_12),
    publishedDate: new Date('2023-11-10'),
  },
  {
    image: '/contents/2000Vignette.jpg',
    title: '2000 demandes',
    slug: '2000-demandes',
    content: importFile(demandes),
    publishedDate: new Date('2023-11-08'),
  },
  {
    image: '/contents/guideExploitantV.jpg',
    title: 'Un guide pour les exploitants',
    slug: 'un-guide-pour-les-exploitants',
    content: importFile(unGuidePourLesExploitants),
    publishedDate: new Date('2023-11-03'),
  },
  {
    image: '/contents/isseane.jpg',
    title: "Visite de l'unité de valorisation énergétique Isséane",
    slug: 'visite-de-l-unité-de-valorisation-énergétique-isséane',
    content: importFile(readme_11),
    publishedDate: new Date('2023-10-24'),
  },
  {
    image: '/contents/video.jpg',
    title: 'Les réseaux de chaleur en moins de 15 secondes',
    slug: 'les-réseaux-de-chaleur-en-moins-de-15-secondes',
    content: importFile(lesReseauxDeChaleurEnMoinsDe15Secondes),
    publishedDate: new Date('2023-10-18'),
  },
  {
    image: '/contents/90.jpg',
    title:
      'La cartographie la plus exhaustive des réseaux de chaleur et de froid',
    slug: 'la-cartographie-la-plus-exhaustive-des-réseaux-de-chaleur-et-de-froid',
    content: importFile(readme_10),
    publishedDate: new Date('2023-10-10'),
  },
  {
    image: '/contents/solaire.jpg',
    title: 'Le solaire thermique',
    slug: 'le-solaire-thermique',
    content: importFile(readme_9),
    publishedDate: new Date('2023-10-02'),
  },
  {
    image: '/contents/guidecolt.jpg',
    title: 'Un guide pour les collectivités',
    slug: 'un-guide-pour-les-collectivites',
    content: importFile(readme_8),
    publishedDate: new Date('2023-09-26'),
  },
  {
    image: '/contents/vignetteOpen.jpg',
    title: 'Mise en open data des tracés des réseaux de chaleur et de froid',
    slug: 'mise-en-open-data-des-tracés-des-réseaux-de-chaleur-et-de-froid',
    content: importFile(readme_1),
    publishedDate: new Date('2023-09-01'),
  },
  {
    image: '/contents/fichevignette.jpg',
    title: 'Des informations techniques et tarifaires par réseau',
    slug: 'des-informations-techniques-et-tarifaires-par-réseau',
    content: importFile(readme_7),
    publishedDate: new Date('2023-08-31'),
  },
  {
    image: '/contents/def-enr.jpg',
    title: "Définir des zones d'accélération des énergies renouvelables",
    slug: 'définir-des-zones-d-accélération-des-énergies-renouvelables',
    content: importFile(readme_6),
    publishedDate: new Date('2023-08-23'),
  },
  {
    image: '/contents/1,6vignette.jpg',
    title: 'Les réseaux les plus écologiques sont les plus économiques !',
    slug: 'les-réseaux-les-plus-écologiques-sont-les-plus-économiques',
    content: importFile(lesReseauxLesPlusEcologiquesSontLesPlusEconomiques),
    publishedDate: new Date('2023-08-10'),
  },
  {
    image: '/contents/63vignette.jpg',
    title: 'Des réseaux vertueux',
    slug: 'des-réseaux-vertueux',
    content: importFile(desReseauxVertueux),
    publishedDate: new Date('2023-08-03'),
  },
  {
    image: '/contents/vignettefroid-art.jpg',
    title: 'Les réseaux de froid sur notre cartographie',
    slug: 'les-réseaux-de-froid-sur-notre-cartographie',
    content: importFile(lesReseauxDeFroidSurNotreCartographie),
    publishedDate: new Date('2023-07-25'),
  },
  {
    image: '/contents/vignette-collectivite.jpg',
    title: "Les chiffres de l'enquête IFOP 3",
    slug: 'les-chiffres-de-lenquete-ifop-3',
    content: importFile(readme_4),
    publishedDate: new Date('2023-07-18'),
  },
  {
    image: '/contents/effortinformation.jpg',
    title: "Les chiffres de l'enquête IFOP 2",
    slug: 'les-chiffres-de-lenquete-ifop-2',
    content: importFile(readme_5),
    publishedDate: new Date('2023-07-06'),
  },
  {
    image: '/contents/bonnenouvelle.jpg',
    title: "Les chiffres de l'enquête IFOP 1",
    slug: 'les-chiffres-de-lenquete-ifop-1',
    content: importFile(readme_1_1),
    publishedDate: new Date('2023-07-04'),
  },
  {
    image: '/contents/objectif.jpg',
    title: "Préparation de la loi de programmation sur l'énergie et le climat",
    slug: 'preparation-de-la-loi-de-programmation-sur-lenergie-et-le-climat',
    content: importFile(readme_1_2),
    publishedDate: new Date('2023-06-27'),
  },
  {
    image: '/contents/vignette-enquete.jpg',
    title: 'Une enquête IFOP pour France Chaleur Urbaine',
    slug: 'une-enquete-ifop-pour-france-chaleur-urbaine',
    content: importFile(uneEnqueteIfopPourFranceChaleurUrbaine),
    publishedDate: new Date('2023-06-27'),
  },
  {
    image: '/contents/vignetteAnnecy.jpg',
    title: "Visite du réseau de froid d'Annecy",
    slug: 'visite-du-réseau-de-froid-d-annecy',
    content: importFile(readme_3),
    publishedDate: new Date('2023-06-06'),
  },
  {
    image: '/contents/vignetteDataCenter.jpg',
    title: "Visite d'un datacenter",
    slug: 'visite-d-un-datacenter',
    content: importFile(visiteDunDatacenter),
    publishedDate: new Date('2023-06-19'),
  },
  {
    image: '/contents/vignettefroid.jpg',
    title: 'Les réseaux de froid',
    slug: 'les-réseaux-de-froid',
    content: importFile(readme_3_1),
    publishedDate: new Date('2023-06-06'),
  },
  {
    image: '/contents/fatale2.jpg',
    title: 'La chaleur fatale',
    slug: 'la-chaleur-fatale',
    content: importFile(readme_4_1),
    publishedDate: new Date('2023-05-25'),
  },
  {
    image: '/contents/24.jpg',
    title:
      'Part des énergies renouvelables dans la consommation finale brute d’énergie en France',
    slug: 'part-des-énergies-renouvelables-dans-la-consommation-finale-brute-d-énergie-en-france',
    content: importFile(readme_3_1_1),
    publishedDate: new Date('2023-05-22'),
  },
  {
    image: '/contents/23.jpg',
    title: 'Dispositif éco-énergie tertiaire',
    slug: 'dispositif-éco-énergie-tertiaire',
    content: importFile(readme_3_1_1_1),
    publishedDate: new Date('2023-05-10'),
  },
  {
    image: '/contents/20.jpg',
    title: "Visite d'une chaufferie biomasse",
    slug: 'visite-d-une-chaufferie-biomasse',
    content: importFile(visiteDuneChaufferieBiomasse),
    publishedDate: new Date('2023-05-10'),
  },
  {
    image: '/contents/19.jpg',
    title: 'La biomasse',
    slug: 'la-biomasse',
    content: importFile(readme_2),
    publishedDate: new Date('2023-04-27'),
  },
  {
    image: '/contents/champigny04.jpg',
    title: "Visite d'un forage de géothermie",
    slug: 'visite-d-un-forage-de-géothermie',
    content: importFile(readme_2_1),
    publishedDate: new Date('2023-04-25'),
  },
  {
    image: '/contents/18.jpg',
    title: 'La géothermie profonde',
    slug: 'la-géothermie-profonde',
    content: importFile(readme_1_1_1),
    publishedDate: new Date('2023-04-25'),
  },
  {
    image: '/contents/17.jpg',
    title: 'Les réseaux de chaleur : des énergies vertes',
    slug: 'les-réseaux-de-chaleur-des-énergies-vertes',
    content: importFile(lesReseauxDeChaleurDesEnergiesVertes),
    publishedDate: new Date('2023-04-20'),
  },
  {
    image: '/contents/16.jpg',
    title: 'Les ménages français et le chauffage',
    slug: 'les-ménages-français-et-le-chauffage',
    content: importFile(readme_2_1_1),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/15.jpg',
    title: 'La décarbonation des réseaux de chaleur est en marche !',
    slug: 'la-décarbonation-des-réseaux-de-chaleur-est-en-marche',
    content: importFile(readme_1_2_1),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/08.jpg',
    title: "L'appel à projets 1 ville 1 réseau de l'ADEME est relancé",
    slug: 'l-appel-à-projets-1-ville-1-réseau-de-l-ademe-est-relancé',
    content: importFile(lappelAProjets1Ville1ReseauDeLademeEstRelance),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/09.jpg',
    title: '1600 réseaux à créer ou étendre',
    slug: '1600-réseaux-à-créer-ou-étendre',
    content: importFile(reseauxACreerOuEtendre),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/avion.jpg',
    title: "6,63 millions d'allers-retours Paris New-York évités",
    slug: '6-63-millions-d-allers-retours-paris-new-york-évités',
    content: importFile(readme_1_1_1_1),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/14 (1).jpg',
    title: 'France Chaleur Urbaine se construit avec ses usagers',
    slug: 'france-chaleur-urbaine-se-construit-avec-ses-usagers',
    content: importFile(franceChaleurUrbaineSeConstruitAvecSesUsagers),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/02.jpg',
    title: 'Une obligation de raccordement pour certains bâtiments',
    slug: 'une-obligation-de-raccordement-pour-certains-bâtiments',
    content: importFile(page_2),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/11.jpg',
    title:
      'Le chauffage urbain pour les bâtiments tertiaires : un contexte on ne peut plus favorable !',
    slug: 'le-chauffage-urbain-pour-les-bâtiments-tertiaires-un-contexte-on-ne-peut-plus-favorable',
    content: importFile(
      leChauffageUrbainPourLesBatimentsTertiairesUnContexteOnNePeutPlusFavorable
    ),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/03.jpg',
    title: "Le chauffage le plus économique pour l'habitat collectif",
    slug: 'le-chauffage-le-plus-économique-pour-l-habitat-collectif',
    content: importFile(leChauffageLePlusEconomiquePourLhabitatCollectif),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/04.jpg',
    title: 'Faisons connaître le chauffage urbain !',
    slug: 'faisons-connaître-le-chauffage-urbain',
    content: importFile(faisonsConnaitreLeChauffageUrbain),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/10 (1).jpg',
    title: 'Se chauffer à prix stables',
    slug: 'se-chauffer-à-prix-stables',
    content: importFile(seChaufferAPrixStables),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/12.jpg',
    title: 'Le chauffage urbain dans la presse',
    slug: 'le-chauffage-urbain-dans-la-presse',
    content: importFile(leChauffageUrbainDansLaPresse),
    publishedDate: new Date('2023-04-05'),
  },
  {
    image: '/contents/05.jpg',
    title: "Un plan national d'action pour la géothermie",
    slug: 'un-plan-national-d-action-pour-la-géothermie',
    content: importFile(unPlanNationalDactionPourLaGeothermie),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/06.jpg',
    title: 'Dossier spécial sur les réseaux de chaleur',
    slug: 'dossier-spécial-sur-les-réseaux-de-chaleur',
    content: importFile(dossierSpecialSurLesReseauxDeChaleur),
    publishedDate: new Date('2023-04-05'),
  },
  {
    image: '/contents/07.jpg',
    title: '636 réseaux de chaleur classés',
    slug: '636-réseaux-de-chaleur-classés',
    content: importFile(reseauxDeChaleurClasses),
    publishedDate: new Date('2023-04-11'),
  },
  {
    image: '/contents/13.jpg',
    title: 'Les syndics et France Chaleur Urbaine',
    slug: 'les-syndics-et-france-chaleur-urbaine',
    content: importFile(lesSyndicsEtFranceChaleurUrbaine),
    publishedDate: new Date('2023-03-27'),
  },
];

export const getArticle = (slug: string) =>
  articles.find((article) => article.slug === slug);
