import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import WrappedText from '@components/WrappedText';
import { dataNumberFcu } from '@data';
import { FooterPartnersLogo, Logo } from '@dataesr/react-dsfr';
import { Logos, Row } from './index.styles';

const Us = () => {
  return (
    <>
      <Slice padding={8}>
        <MarkdownWrapper value={`# Qui sommes-nous ?`} />
        <Row>
          <Logo splitCharacter={10} href="">
            République Française
          </Logo>
          <div>
            France Chaleur Urbaine est un{' '}
            <b>service gratuit proposé par l’État</b> qui promeut le chauffage
            urbain, afin de répondre à trois enjeux majeurs : la lutte contre le
            changement climatique, la maîtrise du tarif des énergies et la
            sécurité d’approvisionnement. France Chaleur Urbaine agit en{' '}
            <b>tiers de confiance</b> en mettant en relation les copropriétaires
            et gestionnaires de bâtiments tertiaires avec les opérateurs des
            réseaux de chaleur.
          </div>
        </Row>
      </Slice>
      <Slice padding={8}>
        <WrappedText
          body={`
## Nos missions :
::check-item[**Outiller** : Mise à disposition d’outils afin de valoriser les réseaux de chaleur : test de raccordement, cartographie des réseaux, simulateur de CO2...]
::check-item[**Informer** : Centralisation d’informations et de données sur les réseaux de chaleur et potentiels de raccordement.]
::check-item[**Mettre en lien** : Mise en relation de prospects intéressés par la solution réseau de chaleur avec les gestionnaires des réseaux les plus proches]
`}
        />
      </Slice>
      <Slice padding={8}>
        <WrappedText
          body={`
## L'équipe :
::check-item[**DRIEAT** : La Direction régionale et interdépartementale de l’environnement, de l’aménagement et des transports (DRIEAT) d’Ile-de-France porte le projet. Florence Lévy, chargée de mission transition énergétique, pilote le projet en tant qu’intrapreneuse.]
::check-item[**BETA GOUV.FR** : France Chaleur Urbaine est une start-up d’Etat du programme Beta.gouv.fr de la Direction interministérielle du numérique (DINUM), qui aide les administrations publiques à construire des services numériques utiles, simples et faciles à utiliser. À ce titre, une équipe de 6 freelances (designer, chargés de déploiement, developpeurs...) accompagne le projet. En savoir plus : [beta.gouv.fr](https://beta.gouv.fr/)]
`}
          imgSrc="/img/equipe-fcu.jpg"
        />
      </Slice>
      <Slice padding={8}>
        <WrappedText
          body={`
## Nos financeurs :
France Chaleur Urbaine est financé par France Relance (au titre d’un guichet porté par la DINUM), par la Direction générale de l’énergie et du climat du Ministère de la transition énergétique, par l’ADEME et par la DRIEAT.
`}
        />
        <Logos>
          <FooterPartnersLogo
            href="https://www.gouvernement.fr/"
            imageSrc="/logo-government.svg"
            target="_blank"
            imageAlt="Gouvernement"
          />
          <FooterPartnersLogo
            href="https://www.ademe.fr"
            imageSrc="/logo-ADEME.svg"
            target="_blank"
            imageAlt="Gouvernement"
          />
          <FooterPartnersLogo
            href="https://www.economie.gouv.fr/plan-de-relance"
            imageSrc="/logo-relance.png"
            target="_blank"
            imageAlt="France relance"
          />
        </Logos>
      </Slice>
      <Slice padding={8} theme="color">
        <h3>Au {dataNumberFcu.date}, France Chaleur Urbaine c’est :</h3>
        <TextList data={dataNumberFcu.data} />
        <i>{dataNumberFcu.note}</i>
      </Slice>
    </>
  );
};

export default Us;
