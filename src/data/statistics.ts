const statistics = {
  connection: '2 109', // nombre de demandes pour lesquelles le statut est étude en cours, réalisé, travaux en cours ou voté en ag.
  logements: '61 080', // logements concernés par les raccordements
  CO2Tons: '113 148', // tonnes de CO2 potentiellement économisées par an
  networks: '978', // somme des réseaux de chaleur et de froid pour lesquels has_trace est coché.
  heatPercent: '97', // se base uniquement sur les réseaux de chaleur, et est calculé en prenant les livraisons totales pour les réseaux où has_trace est coché / livraisons totales pourr tous les réseaux
  connectionPercent: '28', // ratio connection/total des demandes de mise en contact avec un gestionnaire
  iFrameIntegration: '61', // prendre le chiffre indiqué sur Pipedrive dans affaires Iframe / intégrés
  lastActu: '8 septembre 2025',
};

export default statistics;
