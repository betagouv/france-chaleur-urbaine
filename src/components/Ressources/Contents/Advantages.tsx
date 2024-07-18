import { Highlight } from '@codegouvfr/react-dsfr/Highlight';

import { List, Subtitle } from './Contents.styles';

const contents = [
  {
    title: 'Chauffage collectif au fioul :',
    highlight: 'Depuis le 1er juillet 2022, l’installation de nouvelles chaudières au fioul est interdite !',
    list: [
      <>
        Importantes <b>émissions de gaz à effet de serre</b>
      </>,
      <>
        <b>Pollution de l’air</b> (émission de particules fines)
      </>,
      <>
        <b>Coût élevé</b> pour l’entretien de la chaudière
      </>,
      <>
        Tarifs élevés et <b>fortement fluctuants</b> (près de 67 % de hausse entre septembre 2021 et août 2022)
      </>,
      <>
        Énergie importée, dont l’
        <b>approvisionnement est sensible au contexte géopolitique</b>
      </>,
    ],
  },
  {
    title: 'Chauffage collectif au gaz :',
    highlight: 'À partir de 2025, le chauffage au gaz sera interdit dans l’habitat collectif neuf !',
    list: [
      <>
        Importantes <b>émissions de gaz à effet de serre</b>
      </>,
      <>
        <b>Entretien rigoureux</b> des installations nécessaire pour limiter les risques associés aux chaudières
      </>,
      <>
        Tarifs <b>fortement fluctuants</b>
      </>,
      <>
        Énergie importée, dont l’
        <b>approvisionnement est sensible au contexte géopolitique</b>
      </>,
    ],
  },
  {
    title: 'Raccordement à un réseau de chaleur :',
    highlight: 'Les réseaux de chaleur constituent en moyenne la solution de chauffage la plus compétitive pour les logements collectifs !',
    list: [
      <>
        <b>Emissions de gaz à effet de serre et particules fines limitées</b>
      </>,
      <>
        <b>Absence de chaudière et de stockage au sein de l’immeuble - sécurité assurée</b>
      </>,
      <>
        <b>Garantie d’un service public</b>
      </>,
      <>
        <b>Tarifs compétitifs et moins fluctuants que ceux des énergies purement fossiles</b>
        ,
        <br />
        TVA à 5.5 % pour tous les réseaux alimentés plus de 50 % par des énergies renouvelables et de récupération.
        <br />
        <br />
        La couverture du territoire national par les réseaux de chaleur est encore hétérogène. Renseignez votre adresse ci-dessus pour
        vérifier si un réseau passe près de chez vous !
      </>,
    ],
  },
];
const Advantages = () => {
  return (
    <>
      {contents.map((content) => (
        <div key={content.title}>
          <Subtitle>{content.title}</Subtitle>
          <Highlight>
            <b>{content.highlight}</b>
          </Highlight>
          <List>
            {content.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </List>
          <br />
          <br />
        </div>
      ))}
    </>
  );
};

export default Advantages;
