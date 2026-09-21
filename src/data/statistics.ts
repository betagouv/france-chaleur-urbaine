const statistics = {
  CO2Tons: '278 980', // tonnes de CO2 potentiellement économisées par an
  connection: '5 200', // nombre de demandes pour lesquelles le statut est étude en cours, réalisé, travaux en cours ou voté en ag.
  connectionPercent: '46', // ratio connection/total des demandes de mise en contact avec un gestionnaire
  heatPercent: '96', // se base uniquement sur les réseaux de chaleur, et est calculé en prenant les livraisons totales pour les réseaux où has_trace est coché / livraisons totales pourr tous les réseaux
  iFrameIntegration: '40', // nombre d'iframes dans salesforce ADEME, demander à Léa pour le nombre à jour
  lastActu: '21 septembre 2026',
  logements: '170 686', // logements concernés par les raccordements
  networks: '1 073', // somme des réseaux de chaleur et de froid pour lesquels has_trace est coché.
};

export default statistics;
