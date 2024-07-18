import { List } from '@components/Ressources/Contents/Contents.styles';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import Heading from '@components/ui/Heading';
import { dataNumberFcu } from '@data';
import { Description, Logos, Row, Title } from './index.styles';
import Link from '@components/ui/Link';

const Us = () => {
  return (
    <>
      <Slice padding={4}>
        <Heading as="h1" color="blue-france">
          Qui sommes-nous&nbsp;?
        </Heading>
        <Row>
          <div className="fr-logo">République Française</div>
          <Description>
            France Chaleur Urbaine est un{' '}
            <b>service gratuit proposé par l’État</b> qui promeut le chauffage
            urbain, afin de répondre à trois enjeux majeurs : la lutte contre le
            changement climatique, la maîtrise du tarif des énergies et la
            sécurité d’approvisionnement. France Chaleur Urbaine agit en{' '}
            <b>tiers de confiance</b> en mettant en relation les copropriétaires
            et gestionnaires de bâtiments tertiaires avec les opérateurs des
            réseaux de chaleur.
          </Description>
        </Row>
      </Slice>
      <Slice padding={4}>
        <Title>Nos missions :</Title>
        <List>
          <li>
            <b>Outiller</b> : Mise à disposition d’outils afin de valoriser les
            réseaux de chaleur : test de raccordement, cartographie des réseaux,
            simulateur de CO2...
          </li>
          <li>
            <b>Informer</b> : Centralisation d’informations et de données sur
            les réseaux de chaleur et potentiels de raccordement.
          </li>
          <li>
            <b>Mettre en lien</b> : Mise en relation de prospects intéressés par
            la solution réseau de chaleur avec les gestionnaires des réseaux les
            plus proches
          </li>
        </List>
      </Slice>
      <Slice padding={4}>
        <Title>L'équipe :</Title>
        <List>
          <li>
            <b>DRIEAT</b> : La Direction régionale et interdépartementale de
            l’environnement, de l’aménagement et des transports (DRIEAT)
            d’Ile-de-France porte le projet. Florence Lévy, chargée de mission
            transition énergétique, pilote le projet en tant qu’intrapreneuse.
            <br />
            En savoir plus :{' '}
            <Link
              href="https://www.drieat.ile-de-france.developpement-durable.gouv.fr/"
              isExternal
            >
              https://www.drieat.ile-de-france.developpement-durable.gouv.fr/
            </Link>
          </li>
          <li>
            <b>BETA.GOUV.FR</b> : France Chaleur Urbaine est une start-up d’Etat
            du programme Beta.gouv.fr de la Direction interministérielle du
            numérique (DINUM), qui aide les administrations publiques à
            construire des services numériques utiles, simples et faciles à
            utiliser. À ce titre, une équipe de 10 freelances (designer, chargés
            de déploiement, développeurs...) accompagne le projet.
            <br />
            En savoir plus :{' '}
            <Link href="https://beta.gouv.fr" isExternal>
              beta.gouv.fr
            </Link>
          </li>
        </List>
      </Slice>
      <Slice padding={4}>
        <Title>Nos financeurs :</Title>
        <p>
          France Chaleur Urbaine est financé par la Direction interministérielle
          du numérique, par la Direction générale de l’énergie et du climat du
          Ministère de la transition écologique, par l’ADEME et par la DRIEAT.
        </p>
        <Logos>
          <Link href="https://www.gouvernement.fr/" isExternal>
            <img src="/logo-government.svg" alt="Gouvernement" height="80px" />
          </Link>
          <Link href="https://www.ademe.fr" isExternal>
            <img src="/logo-ADEME.svg" alt="Gouvernement" height="80px" />
          </Link>
        </Logos>
      </Slice>
      <Slice padding={4} theme="color">
        <h3>Au {dataNumberFcu.date}, France Chaleur Urbaine c’est :</h3>
        <TextList data={dataNumberFcu.data} />
        <i>{dataNumberFcu.note}</i>
      </Slice>
    </>
  );
};

export default Us;
