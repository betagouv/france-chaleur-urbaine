const accompagnementRcu = [
  {
    type: 'text-block',
    props: {
      body: `
#### **_Vous êtes chauffé au fioul ou au gaz&nbsp;?_**  
#### France Chaleur Urbaine vous accompagne pour changer et vous raccorder à un réseau de chaleur.

:::puce-icon{icon="./icons/picto-copro.svg"}
**Vous accédez** à de la documentation détaillée.
:::

:::puce-icon{icon="./icons/picto-resource.svg"}
**Vous êtes conseillé** et accompagné dans toutes vos démarches
:::

:::puce-icon{icon="./icons/picto-relation.svg"}
**Vous pouvez être mis en relation** avec des copropriétaires déjà raccordés, ou un exploitant
:::

        `,
    },
  },
  {
    type: 'text-block',
    props: {
      className: 'warning',
      body: `
![Attention](./icons/picto-warning.svg)  
**À partir du 1er juillet 2022,** de nouvelles normes environnementales, qui visent à limiter les émissions de gaz à effet de serre, entreront en vigueur et **excluent l'installation de nouvelles chaudières au fioul.**

**Des aides accompagnent cette transition.**

**Avec France Chaleur Urbaine, renseignez-vous sur les possibilités de raccordement de votre copropriété à un réseau de chaleur, une alternative écologique et économique !**

        `,
    },
  },
];

export default accompagnementRcu;
