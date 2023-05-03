const comparatifRcu = [
  {
    type: 'image',
    props: {
      src: '/img/rcu-comparatif-coproprietaire.svg',
      alt: `Comparatif des couts d'une installation raccordé aux réseaux de chaleur par rapport aux autres sources d'énergie.`,
      className: 'rcu-comparatif-image',
    },
  },
  {
    type: 'text-block',
    props: {
      className: 'rcu-comparatif-warning',
      body: `Le chauffage urbain est le mode de chauffage **le moins cher sur le marché** pour les logements en habitat collectif (copropriété, logement social...) loin devant le gaz, l’électricité et le fioul dont les tarifs ne cessent d’augmenter.
      
La figure ci-contre montre **le coût global annuel chauffage + eau chaude sanitaire pour un appartement moyen (70 m2) construit entre 2005 et 2012** (consommation : 96 kWhu/m2/an)
*Enquête sur le prix de vente de la chaleur et du froid 2021 (Amorce 2022)*`,
    },
  },
];

export default comparatifRcu;
