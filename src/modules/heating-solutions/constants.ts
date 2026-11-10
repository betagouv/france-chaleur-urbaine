import type { ModeDeChauffageId } from '@/modules/chaleur-renouvelable/constants';

import type { SolutionBuildingLabel } from './article-sections';

export const heatingSolutions = [
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/air-water.svg',
    modeIds: ['collective-air-water-heat-pump'],
    slug: 'pac-air-eau-collective',
    sourceUrl: 'https://app.notion.com/3876523d57d78029866be5adc593a680',
    subtitle:
      'La PAC air/eau collective puise une partie de la chaleur dans l’air. Elle peut remplacer une chaudière gaz ou fioul collective.',
    title: 'PAC air/eau collective',
  },
  {
    buildingLabel: 'logement',
    image: 'img/heating-solutions/air-water.svg',
    modeIds: ['individual-apartment-air-water-heat-pump', 'house-air-water-heat-pump'],
    slug: 'pac-air-eau-individuelle',
    sourceUrl: 'https://app.notion.com/3976523d57d78092b21deafdf5051db6',
    subtitle: 'La PAC air/eau individuelle puise une partie de la chaleur dans l’air. Elle peut remplacer une chaudière gaz ou fioul.',
    title: 'PAC air/eau individuelle (appartement + maison)',
  },
  {
    buildingLabel: 'logement',
    image: 'img/heating-solutions/air-air.svg',
    modeIds: ['individual-apartment-air-air-heat-pump', 'house-air-air-heat-pump'],
    slug: 'pac-air-air-individuelle',
    sourceUrl: 'https://app.notion.com/3d46523d57d7801e8a2dd7d7ffcdd61a',
    subtitle: "Chauffe ou refroidit de l'air en prélevant de la chaleur dans l'air via une unité extérieure.",
    title: 'PAC air/air individuelle (appartement et maison)',
  },
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/biomass-boiler.svg',
    modeIds: ['collective-biomass-boiler'],
    slug: 'chaudiere-biomasse-collective',
    sourceUrl: 'https://app.notion.com/3d46523d57d780c097bac56d900f3b3b',
    subtitle: "Elle chauffe de l'eau via une chaudière consommant de la biomasse (buches, plaquettes, granulés…).",
    title: 'Chaudière à bois ou biomasse (collectif)',
  },
  {
    buildingLabel: 'maison',
    image: 'img/heating-solutions/geothermal-house.svg',
    modeIds: ['house-geothermal-heat-pump'],
    slug: 'pac-geothermique-individuelle',
    sourceUrl: 'https://app.notion.com/3e96523d57d78035bf8bf3b9c98ea18b',
    subtitle:
      'La PAC géothermique individuelle puise une partie de la chaleur dans le sous-sol (eau d’une nappe souterraine ou sol). Elle peut remplacer une chaudière gaz ou fioul.',
    title: 'PAC géothermique eau/eau individuelle (maison) ou glycolée/eau individuelle',
  },
  {
    buildingLabel: 'maison',
    image: 'img/heating-solutions/biomass-boiler.svg',
    modeIds: ['house-biomass-boiler'],
    slug: 'chaudiere-biomasse-individuelle',
    sourceUrl: 'https://app.notion.com/3ea6523d57d7802ebd31d6197c7280e5',
    subtitle:
      'La chaudière à bois ou biomasse utilise le bois comme combustible pour chauffer l’ensemble de la maison et, selon l’installation, produire l’eau chaude sanitaire.',
    title: 'Chaudière à bois ou biomasse (individuelle)',
  },
  {
    buildingLabel: 'logement',
    image: 'img/heating-solutions/wood-stove.svg',
    modeIds: ['house-wood-stove'],
    slug: 'poele-insert-bois',
    sourceUrl: 'https://app.notion.com/3ea6523d57d7804eb1f8d652487b5677',
    subtitle: 'Chauffe un logement grâce à la combustion de bois, sous forme de bûches ou de granulés',
    title: 'Poêle, insert ou foyer fermé au bois (individuel)',
  },
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/air-water.svg',
    modeIds: ['collective-air-water-heat-pump-hot-water', 'individual-apartment-collective-air-water-heat-pump-hot-water'],
    slug: 'pac-air-eau-collective-eau-chaude-sanitaire',
    sourceUrl: 'https://app.notion.com/3ea6523d57d780c59f19d0435cb52118',
    subtitle: 'La PAC air/eau collective dédiée à l’eau chaude sanitaire peut remplacer un système fossile',
    title: 'PAC air/eau collective pour l’ECS uniquement',
  },
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/hybrid.svg',
    modeIds: ['collective-hybrid-air-water-heat-pump-gas'],
    slug: 'pac-air-eau-hybride-gaz-collective',
    sourceUrl: 'https://app.notion.com/3d46523d57d7804ba2ddc5bd51b34c7d',
    subtitle: "Combinaison d'une pompe à chaleur (PAC) avec une chaudière pour assurer l'appoint.",
    title: 'Solution hybride PAC air/eau + gaz pour chauffage collectif',
  },
  {
    buildingLabel: 'maison',
    image: 'img/heating-solutions/solar-thermal.svg',
    modeIds: ['house-solar-thermal-hot-water'],
    slug: 'solaire-thermique-eau-chaude-maison',
    sourceUrl: 'https://app.notion.com/3d46523d57d78092a24cda91a78af394',
    subtitle: "Produit l'eau chaude sanitaire grâce à des capteurs installés généralement sur la toiture.",
    title: 'Solaire thermique - ECS uniquement (maison)',
  },
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/solar-thermal.svg',
    modeIds: ['collective-solar-thermal-hot-water', 'individual-apartment-solar-thermal-hot-water'],
    slug: 'solaire-thermique-eau-chaude-collective',
    sourceUrl: 'https://app.notion.com/3ea6523d57d78074aa22f60eb160dc6c',
    subtitle: "Produit l'eau chaude sanitaire grâce à des capteurs installés généralement sur la toiture.",
    title: 'Solaire thermique - ECS uniquement (collective)',
  },
  {
    buildingLabel: 'maison',
    image: 'img/heating-solutions/solar-thermal.svg',
    modeIds: ['house-combined-solar-system'],
    slug: 'systeme-solaire-combine',
    sourceUrl: 'https://app.notion.com/3ea6523d57d780ca8d82e73a9f3153eb',
    subtitle: "Produit l'eau chaude sanitaire et du chauffage grâce à des capteurs installés généralement sur la toiture.",
    title: 'Solaire thermique - système solaire combiné (maison)',
  },
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/network.svg',
    modeIds: ['collective-heat-network'],
    slug: 'reseau-de-chaleur',
    sourceUrl: 'https://app.notion.com/p/3e56523d57d780e59b1ac7f04c640940?pvs=204',
    subtitle: "Réseau de canalisations souterraines qui achemine la chaleur jusqu'à l'immeuble.",
    title: 'Réseau de chaleur',
  },
  {
    buildingLabel: 'immeuble',
    image: 'img/heating-solutions/geothermal-collective.svg',
    modeIds: ['collective-geothermal-heat-pump'],
    slug: 'pac-geothermique-collective',
    sourceUrl: 'https://app.notion.com/p/3d46523d57d7808d81faeec04d95af24?pvs=204',
    subtitle: 'La PAC géothermique collective puise une partie de la chaleur dans le sous-sol (eau d’une nappe souterraine ou sol).',
    title: 'PAC géothermique eau/eau ou eau/glycolée eau collective',
  },
  {
    buildingLabel: 'logement',
    image: 'img/heating-solutions/thermodynamic-water-heater.svg',
    modeIds: [
      'collective-thermodynamic-water-heater',
      'individual-apartment-thermodynamic-water-heater',
      'house-thermodynamic-water-heater',
    ],
    slug: 'chauffe-eau-thermodynamique',
    sourceUrl: 'https://app.notion.com/p/3ea6523d57d78065836aceb4096d963f?pvs=204',
    subtitle: 'Le chauffe-eau thermodynamique utilise les calories de l’air pour produire l’eau chaude sanitaire.',
    title: 'Chauffe-eau thermodynamique ECS uniquement',
  },
] as const satisfies readonly {
  buildingLabel: SolutionBuildingLabel;
  image: string;
  modeIds: readonly ModeDeChauffageId[];
  slug: string;
  sourceUrl: string;
  subtitle: string;
  title: string;
}[];

export type HeatingSolution = (typeof heatingSolutions)[number];

export const getHeatingSolution = (slug: string | undefined): HeatingSolution | undefined =>
  heatingSolutions.find((solution) => solution.slug === slug);

export const getHeatingSolutionHref = (modeId: ModeDeChauffageId): string | undefined => {
  const solution = heatingSolutions.find((solution) => solution.modeIds.some((identifier) => identifier === modeId));
  return solution ? `/ressources/${solution.slug}` : undefined;
};
