const comparatifRcu = [
  {
    type: 'image',
    props: {
      src: './img/rcu-comparatif-coproprietaire.svg',
      alt: `Comparatif des couts d'une installation raccordé aux réseaux de chaleur par rapport aux autres sources d'énergie.`,
      legend: `**Coût global annuel chauffage + eau chaude sanitaire pour un logement collectif moyen (70 m²) construit entre 2005 et 2012 (consommation : 96 kWhu/m²/an)**  
      Enquête annuelle sur le prix de vente de la chaleur et du froid en 2020 (Amorce 2022)`,
      className: 'rcu-comparatif-image',
      legendClassName: 'rcu-comparatif-image-legend',
    },
  },
  {
    type: 'text-block',
    props: {
      className: 'rcu-comparatif-warning',
      body: `
![Attention](./icons/picto-warning.svg)  
**Votre copropriété est mal isolée ?**
Pour réduire votre facture et votre impact écologique, 
pensez avant tout à améliorer l’isolation thermique 
de votre copropriété !
Rendez-vous sur [France Rénov](https://france-renov.gouv.fr/) pour être accompagné dans 
vos projets de rénovation énergétique.
        `,
    },
  },
];

export default comparatifRcu;
