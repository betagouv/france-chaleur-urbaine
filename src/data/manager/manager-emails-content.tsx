interface emailsContentData {
  [index: string]: any;
}

export const emailsContentList: emailsContentData = {
  askForPieces: {
    object: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,
 
Vous avez réalisé une demande de raccordement au réseau de chaleur pour le [adresse] sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Afin de pouvoir étudier votre demande, nous vous remercions de nous transmettre les éléments complémentaires suivants :
-   
- 
-

Cordialement,`,
  },
  koFarFromNetwok: {
    object: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,
    
Vous avez réalisé une demande de raccordement au réseau de chaleur pour le [adresse] sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Néanmoins, suite à l’analyse de votre demande, il apparaît que la distance entre votre bâtiment et le réseau de chaleur est trop importante pour qu’un raccordement soit pertinent d’un point de vue technique et économique.

Des développements du réseau sont possibles dans les années à venir. Nous conservons donc votre demande afin que vous puissiez être recontacté si le raccordement de votre bâtiment devenait réalisable.

Cordialement,`,
  },
  koIndividualHeat: {
    object: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,
    
Vous avez réalisé une demande de raccordement au réseau de chaleur pour le [adresse] sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Néanmoins, le raccordement de votre bâtiment n’est pas réalisable au vu de votre chauffage actuel individuel : il nécessiterait des travaux extrêmement conséquents et coûteux pour mettre en place un système de canalisations internes à l’immeuble permettant de distribuer la chaleur aux différents logements.

Cordialement,`,
  },
  koOther: {
    object: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,
    
Vous avez réalisé une demande de raccordement au réseau de chaleur pour le [adresse] sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Néanmoins, suite à l’analyse de votre demande, nous sommes au regret de vous informer que le raccordement de votre bâtiment ne peut être réalisé.

Cordialement,`,
  },
  other: {
    object: '',
    body: '',
  },
  receipt: {
    object: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,
    
Vous avez réalisé une demande de raccordement au réseau de chaleur pour le [adresse] sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Votre demande est bien prise en compte, nous reviendrons vers vous dans les meilleurs délais.

Cordialement,`,
  },
};

export default emailsContentList;
