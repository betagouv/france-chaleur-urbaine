import { Col, Row } from '@dataesr/react-dsfr';
import { List, Subtitle } from './Contents.styles';

const contents = [
  {
    title: 'Environnement et santé :',
    list: [
      'Des émissions de gaz à effet de serre réduites, contribuant à la lutte contre le changement climatique.',
      'Des émissions de particules fines réduites, contribuant à la lutte contre la pollution de l’air.',
    ],
  },
  {
    title: 'Maîtrise des coûts :',
    list: [
      'Des tarifs plus stables et en moyenne plus compétitifs que ceux des autres énergies de chauffage.',
      'Un taux de TVA réduit à 5,5 % sur l’abonnement pour tous les réseaux, et sur l’ensemble de la facture (abonnement+consommations) pour les réseaux alimentés à plus de 50 % par des énergies renouvelables et de récupération.',
    ],
  },
  {
    title: 'Sécurité et fiabilité :',
    list: [
      'La suppression des chaudières et combustibles au sein des immeubles → réduction des risques associés et gain de place.',
      'Une réglementation plus stricte que pour une installation individuelle, une surveillance et un entretien renforcés, la garantie d’un service public.',
      'Une sécurité d’approvisionnement assurée.',
      'L’absence de rupture de chauffage et d’eau chaude.',
    ],
  },
  {
    title: 'Emploi :',
    list: [
      'Une source d’emploi non délocalisable (construction, fonctionnement, maintenance.',
    ],
  },
];

const Strengths = () => {
  return (
    <>
      {contents.map((content, index) => (
        <Row key={content.title} className="fr-my-4w">
          <Col n="sm-0 md-2" className="fr-hidden fr-unhidden-md">
            <img
              width="100%"
              src={`/img/ressources-strenghts-${index + 1}.svg`}
              alt=""
            />
          </Col>
          <Col n="sm-12 md-10">
            <Subtitle>{content.title}</Subtitle>
            <List>
              {content.list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </List>
          </Col>
        </Row>
      ))}
    </>
  );
};

export default Strengths;
