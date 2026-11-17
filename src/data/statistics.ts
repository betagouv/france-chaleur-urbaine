const statistics = {
  CO2Tons: '313 370', // tonnes de CO2 potentiellement économisées par an
  connection: '5 841', // nombre de demandes pour lesquelles le statut est étude en cours, réalisé, travaux en cours ou voté en ag.
  connectionPercent: '43', // ratio connection/total des demandes de mise en contact avec un gestionnaire
  heatPercent: '96', // se base uniquement sur les réseaux de chaleur, et est calculé en prenant les livraisons totales pour les réseaux où has_trace est coché / livraisons totales pourr tous les réseaux
  iFrameIntegration: '45', // nombre d'iframes dans salesforce ADEME, demander à Léa pour le nombre à jour
  lastActu: '17 novembre 2026',
  logements: '197 953', // logements concernés par les raccordements
  networks: '1 076', // somme des réseaux de chaleur et de froid pour lesquels has_trace est coché.
};

export default statistics;
