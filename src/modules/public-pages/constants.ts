import type { IconProps } from '@/components/ui/Icon';
import type { TrackingEvent } from '@/modules/analytics/client';

export const PUBLIC_PAGE_SOURCES = ['home', 'fcr_landing'] as const;
/** Analytics source of a public page: prefixes the PostHog events emitted by the shared sections. */
export type PublicPageSource = (typeof PUBLIC_PAGE_SOURCES)[number];

export const BENEFITS = [
  {
    description: 'Prix du gaz et fioul : instables. Énergies renouvelables locales : stables sur le long terme.',
    icon: 'icon-money.png',
    title: 'Protégez-vous des hausses du gaz ou du fioul',
  },
  {
    description: "MaPrimeRénov', CEE, aides locales : des financements publics couvrant une grande partie des travaux.",
    icon: 'icon-immeuble.png',
    title: 'Bénéficiez d’aides pour financer votre projet',
  },
  {
    description: 'Une meilleure classe DPE protège votre bien immobilier des décotes et le maintient compétitif sur le marché.',
    icon: 'icon-graph.png',
    title: "Améliorez l'étiquette DPE de votre bien",
  },
  {
    description:
      'Passer à un système de chauffage écologique peut diviser par deux les émissions de votre chauffage : un geste concret pour la transition écologique.',
    icon: 'icon-feuille.png',
    title: 'Réduisez vos émissions de CO2',
  },
  {
    description: 'Chaleur homogène en hiver, fraîcheur possible en été avec certaines solutions réversibles.',
    icon: 'icon-thermometre.png',
    title: 'Gagnez en confort toute l’année',
  },
  {
    description: 'Les systèmes de chauffage écologiques sont souvent moins chers et plus efficaces que le gaz ou le fioul.',
    icon: 'icon-money.png',
    title: 'Réduisez vos factures d’énergie',
  },
] as const satisfies readonly { description: string; icon: string; title: string }[];

export const TESTIMONIALS = [
  {
    image: 'coachcopro-biomasse.webp',
    link: 'https://www.coachcopro.com/projets-realises/87-boulevard-suchet-75016-paris',
    nbLogement: 34,
    title: 'Une expérience de chaufferie biomasse réussie',
    year: 1930,
  },
  {
    image: 'coachcopro-pac.webp',
    link: 'https://www.coachcopro.com/projets-realises/50-avenue-jean-jaures-75019-paris',
    nbLogement: 41,
    title: 'Installation d’une PAC pour l’eau chaude sanitaire',
    year: 1979,
  },
  {
    image: 'coachcopro-rcu.webp',
    link: 'https://www.coachcopro.com/projets-realises/25-rue-de-l-ukraine-31100-toulouse',
    nbLogement: 136,
    title: 'Raccordement au réseau de chaleur urbain à Toulouse',
    year: 1975,
  },
  {
    image: 'temoignage_geothermie.webp',
    link: 'https://www.calameo.com/read/007297783665ca6300ea6?authid=UPbbt4BqJjfT',
    nbLogement: 39,
    title: "Installation d'une PAC eau / eau sur sonde géothermique",
    year: 2018,
  },
] as const satisfies readonly { image: string; link: string; nbLogement: number; title: string; year: number }[];

/** Line breaks are meaningful: they are rendered as-is in the desktop timeline. */
export const STEPS = [
  { text: 'Je découvre les solutions\nadaptées à mon bâtiment', title: 'Je simule' },
  { text: "Un·e conseiller·ère m'aide gratuitement à affiner mon projet", title: 'Je suis accompagné' },
  { text: 'Un DPE ou audit énergétique précise les travaux à envisager', title: 'Je réalise un audit' },
  { text: "Je monte mon dossier MaPrimeRénov', CEE ...", title: 'Je mobilise les aides' },
  { text: 'Vote en\nassemblée générale', title: 'Ma copropriété décide' },
  { text: 'Les travaux sont réalisés par un professionnel', title: 'Je fais installer' },
  { text: 'D’un chauffage confortable, écologique et économique', title: 'Je profite' },
] as const satisfies readonly { text: string; title: string }[];

/** Answers are trusted HTML authored by the team (rendered with `dangerouslySetInnerHTML`). */
export const FAQS = [
  {
    answer: `Un <strong>réseau de chaleur</strong> est un système qui produit la chaleur de manière centralisée puis la distribue à plusieurs bâtiments grâce à des canalisations enterrées. C’est comparable à un chauffage central… mais à l’échelle d’un quartier entier.<br />
La chaleur est majoritairement produite à partir d’<strong>énergies renouvelables ou de récupération</strong> comme la biomasse, la géothermie ou la chaleur issue d’installations industrielles, ce qui en fait une solution particulièrement écologique.`,
    question: 'Comment fonctionne un réseau de chaleur ?',
  },
  {
    answer:
      "De nombreux dispositifs existent : MaPrimeRénov', les Certificats d'Économies d'Énergie (CEE), l'éco-prêt à taux zéro (éco-PTZ), ou encore des aides locales des collectivités. Les montants varient selon les revenus, le type de système installé et le gain énergétique obtenu.",
    question: 'Quelles aides financières puis-je obtenir pour financer mon projet',
  },
  {
    answer: `Tous les systèmes écologiques ne peuvent pas assurer le rafraichissement, c'est l'un des avantages des pompes à chaleur collectives réversibles : elles peuvent inverser leur cycle pour fonctionner comme une climatisation. Certains systèmes géothermiques permettent également un "free cooling" passif, en faisant simplement circuler l'eau fraîche du sous-sol sans compresseur.`,
    question: 'Les systèmes de chauffage écologiques peuvent-ils aussi assurer le rafraîchissement en été ?',
  },
  {
    answer:
      "Absolument, et c'est même souvent conseillé. Un système hybride associant par exemple une PAC et des panneaux solaires thermiques, ou une chaudière biomasse couplée à du solaire, permet d'optimiser les performances selon les saisons et de réduire la dépendance à une seule source d'énergie.",
    question: 'Peut-on combiner plusieurs systèmes de chauffage ?',
  },
  {
    answer:
      'Le système collectif de chauffage a de nombreux avantages : gain de place, coûts partagés, puissance réduite …\nC’est surtout celui qui permet d’installer plus facilement un chauffage écologique : réseau de chaleur, géothermie, biomasse, solaire thermique, pompe à chaleur… tout est possible !',
    question: 'Quels sont les avantages d’un système de chauffage collectif par rapport à un chauffage individuel',
  },
] as const satisfies readonly { answer: string; question: string }[];

export type PublicPageTool = {
  description: string;
  /** Matomo event, only for tools that already had one before the tabs layout. */
  eventKey?: TrackingEvent;
  href: string;
  icon: IconProps['name'];
  /** PostHog `element_name` of the tile. */
  name: string;
  title: string;
};

export const TOOL_TABS = [
  {
    id: 'reseau_de_chaleur',
    label: 'Réseau de chaleur',
    tools: [
      {
        description: 'Testez une liste d’adresses en une fois.',
        eventKey: "Outil|Test d'adresses en masse",
        href: '/pro/tests-adresses',
        icon: 'fr-icon-file-text-line',
        name: 'test_adresses_masse',
        title: 'Test d’adresses',
      },
      {
        description: 'Estimez le coût de raccordement.',
        eventKey: 'Outil|Coûts de raccordement et aides',
        href: '/ressources/combien-coute-un-raccordement-a-un-reseau-de-chaleur#contenu',
        icon: 'fr-icon-money-euro-circle-line',
        name: 'cout_raccordement',
        title: 'Coût',
      },
      {
        description: 'Mon bâtiment est-il concerné ?',
        eventKey: 'Outil|Obligations de raccordement',
        href: '/ressources/obligations-raccordement#contenu',
        icon: 'fr-icon-scales-3-line',
        name: 'obligations_raccordement',
        title: 'Obligations',
      },
      {
        description: 'Visualisez les réseaux de chaleur autour de vous.',
        eventKey: 'Outil|Carte des réseaux et potentiels',
        href: '/carte',
        icon: 'fr-icon-road-map-line',
        name: 'carte',
        title: 'Cartographie',
      },
      {
        description: 'Caractéristiques de tous les réseaux de chaleur.',
        eventKey: 'Outil|Liste des réseaux de chaleur',
        href: '/reseaux',
        icon: 'fr-icon-list-unordered',
        name: 'liste_reseaux',
        title: 'Liste des réseaux',
      },
      {
        description: 'Communes au potentiel de création de réseau.',
        eventKey: 'Outil|Potentiel des communes sans réseau',
        href: '/collectivites-et-exploitants/potentiel-creation-reseau',
        icon: 'fr-icon-seedling-line',
        name: 'potentiel_communes',
        title: 'Réseaux d’avenir',
      },
    ],
  },
  {
    id: 'energies_renouvelables',
    label: 'Toutes les énergies renouvelables',
    tools: [
      {
        description: 'Comparez les solutions de chauffage adaptées.',
        eventKey: 'Outil|Compatibilité des modes de chauffage',
        href: '/chaleur-renouvelable',
        icon: 'fr-icon-layout-grid-line',
        name: 'chaleur_renouvelable',
        title: 'Trouver sa solution',
      },
      {
        description: 'Comparez les coûts et émissions CO2 des solutions entre elles.',
        eventKey: "Outil|Comparateur de coûts et d'émissions de CO2",
        href: '/comparateur-couts-performances',
        icon: 'fr-icon-money-euro-circle-line',
        name: 'comparateur',
        title: 'Coûts et émissions CO2',
      },
      {
        description: 'Évaluez le montant d’aides auquel vous êtes éligible.',
        href: '/professionnels#simulateur-aide',
        icon: 'ri-hand-coin-line',
        name: 'simulateur_aides',
        title: 'Simuler ses aides',
      },
      {
        description: 'Visualisez les réseaux de chaleur autour de vous.',
        eventKey: 'Outil|Carte des réseaux et potentiels',
        href: '/carte',
        icon: 'fr-icon-road-map-line',
        name: 'carte',
        title: 'Cartographie',
      },
      {
        description: 'Découvrez nos articles sur les énergies renouvelables.',
        href: '/ressources',
        icon: 'fr-icon-article-line',
        name: 'articles',
        title: 'Articles',
      },
    ],
  },
] as const satisfies readonly { id: string; label: string; tools: readonly PublicPageTool[] }[];
export type ToolTabId = (typeof TOOL_TABS)[number]['id'];
