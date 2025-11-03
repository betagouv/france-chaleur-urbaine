const statistics = {
  CO2Tons: '121 785', // tonnes de CO2 potentiellement économisées par an
  connection: '2 270', // nombre de demandes pour lesquelles le statut est étude en cours, réalisé, travaux en cours ou voté en ag.
  connectionPercent: '27', // ratio connection/total des demandes de mise en contact avec un gestionnaire
  heatPercent: '97', // se base uniquement sur les réseaux de chaleur, et est calculé en prenant les livraisons totales pour les réseaux où has_trace est coché / livraisons totales pourr tous les réseaux
  iFrameIntegration: '64', // prendre le chiffre indiqué sur Pipedrive dans affaires Iframe / intégrés
  lastActu: '3 novembre 2025',
  logements: '66 812', // logements concernés par les raccordements
  networks: '987', // somme des réseaux de chaleur et de froid pour lesquels has_trace est coché.
};

export default statistics;
