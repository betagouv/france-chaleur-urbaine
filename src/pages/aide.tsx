import SimplePage from '@components/shared/page/SimplePage';
import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import { fr } from '@codegouvfr/react-dsfr';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

type FaqItem = {
  title: string;
  content: string | JSX.Element;
};
const faqItems: FaqItem[] = [
  {
    title: 'À qui est ouvert l’espace gestionnaire ?',
    content: (
      <>
        <p className="fr-mb-0">
          L’espace gestionnaire est ouvert aux collectivités et exploitants
        </p>
        <ul>
          <li>
            La <b>collectivité</b> a accès aux demandes situées sur l’ensemble
            de son territoire. Elle peut si elle le souhaite vérifier la bonne
            affectation des demandes à ses délégataires (colonne « Affecté à »).
            Les délégataires sont en charge du traitement des demandes, sauf
            dans les cas suivants :
            <ul>
              <li>réseaux gérés en régie ;</li>
              <li>
                demande « non affectée » par France Chaleur Urbaine, car
                éloignée du réseau : la collectivité peut soit affecter la
                demande à son délégataire, si elle se situe sur le périmètre de
                la concession, soit apporter directement une réponse au
                demandeur.
              </li>
            </ul>
          </li>
          <li>
            L’<b>exploitant du réseau de chaleur</b> a accès aux demandes
            situées à proximité du réseau qu’il gère. Il apporte une réponse aux
            demandeurs et met à jour le statut de celles-ci.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Comment savoir qui a accès aux demandes déposées sur mes réseaux ?',
    content: (
      <p>
        Cette information n’est à ce jour pas directement visible depuis
        l’espace gestionnaire, mais peut être obtenue par un simple mail adressé
        à{' '}
        <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
          france-chaleur-urbaine@developpement-durable.gouv.fr
        </a>
        .
      </p>
    ),
  },
  {
    title:
      'Comment ouvrir un accès à l’espace gestionnaire à un membre de mon équipe ?',
    content: (
      <p>
        Il suffit pour cela d’envoyer un mail à l’adresse{' '}
        <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
          france-chaleur-urbaine@developpement-durable.gouv.fr
        </a>
        .
      </p>
    ),
  },
  {
    title: 'Qui doit modifier le statut des demandes ?',
    content: (
      <p>
        C’est l’exploitant du réseau, excepté pour les réseaux en régie ou pour
        les demandes « non affectées », pour lesquels c’est la collectivité.
      </p>
    ),
  },
  {
    title: 'Pourquoi compléter la colonne statut ?',
    content: (
      <>
        <p className="fr-mb-0">
          Il est important de renseigner le statut des demandes pour permettre à
          France Chaleur Urbaine :
        </p>
        <ul>
          <li>
            de quantifier son impact. En tant que start-up d’État, France
            Chaleur Urbaine doit en effet pouvoir justifier chaque année de son
            impact auprès de ses financeurs ;
          </li>
          <li>
            d’informer les demandeurs qui n’auraient pas encore été recontactés
            suite à leur demande et solliciteraient France Chaleur Urbaine pour
            connaître l’état d’avancement de leur demande.
          </li>
        </ul>
        <p>
          L’information peut également être utile aux autorités délégantes qui
          se connectent sur leur espace : elles peuvent ainsi s’assurer que les
          demandes ont bien été vues par leur délégataire.
        </p>
      </>
    ),
  },
  {
    title:
      'La modification du statut d’une demande génère-t-il l’envoi d’une notification au demandeur ?',
    content: (
      <p>
        Non, la modification du statut d’une demande ne génère l’envoi d’aucune
        notification.
      </p>
    ),
  },
  {
    title:
      'Qui doit répondre aux demandes visibles sur mon espace gestionnaire ?',
    content: (
      <p>
        Il appartient à l’opérateur à qui a été affectée une demande de
        reprendre contact avec le prospect pour y donner suite (demande de
        pièces supplémentaires, confirmation ou non de la faisabilité du
        raccordement…). Les demandes indiquées comme « non affectées », situées
        loin des réseaux existants, ne sont visibles que par la collectivité.
        Celle-ci peut décider de les réaffecter à son délégataire en modifiant
        l’information dans la colonne « Affecté à ». Elle peut également
        reprendre contact si elle le souhaite avec le prospect pour l’informer
        d’éventuelles perspectives de développement du réseau à proximité de
        l’adresse testée. À noter que pour ces adresses, le prospect a déjà été
        informé par une réponse automatique de France Chaleur Urbaine qu’il
        n’existe pas de réseau de chaleur à proximité de son adresse, mais que
        la demande est transmise à la collectivité afin qu’il puisse être
        informé si le réseau venait à se déployer dans son quartier.{' '}
      </p>
    ),
  },
  {
    title:
      'Comment répondre aux demandes / envoyer un mail de réponse à une demande depuis mon espace gestionnaire ?',
    content: (
      <p>
        Si vous le souhaitez, vous pouvez répondre aux demandes directement
        depuis votre espace gestionnaire à partir de la colonne "Contact", en
        cliquant sur l'enveloppe ou sur l'adresse mail du demandeur. Plusieurs
        modèles de mails vous sont proposés, que vous pouvez librement modifier.
        Les champs "Répondre à" et "Copie à" sont renseignés par défaut avec
        l'adresse mail avec laquelle vous vous êtes connecté(e) à votre espace.
        Votre signature est enregistrée suite à l'envoi d'un premier mail, mais
        vous gardez la possibilité de la modifier. Enfin, la rubrique
        "historique", qui liste les messages envoyés, est visible pour toute
        personne ayant accès aux demandes (à noter que seul le type de message
        est indiqué, sans accès au message complet).
      </p>
    ),
  },
  {
    title:
      'D’où proviennent les données qui figurent dans mon espace gestionnaire ? / À quoi correspondent les différents champs du tableau ?',
    content: (
      <>
        <p className="fr-mb-0">
          Informations renseignées par le demandeur lors du dépôt de
          formulaire :
        </p>
        <ul>
          <li>
            <b>Contact</b>, <b>Adresse</b>, <b>Type</b> (de bâtiment),{' '}
            <b>Mode de chauffage</b>
          </li>
        </ul>
        <p className="fr-mb-0">
          Informations complétées par France Chaleur Urbaine :{' '}
        </p>
        <ul>
          <li>
            Une étiquette “PDP” est ajoutée lorsque le bâtiment est situé dans
            un périmètre de développement prioritaire référencé sur France
            Chaleur Urbaine.{' '}
          </li>
          <li>
            <b>Distance au réseau (m) :</b> distance à vol d’oiseau entre le
            bâtiment et le réseau de chaleur le plus proche, calculée par France
            Chaleur Urbaine.
          </li>
          <li>
            <b>ID réseau le plus proche :</b> identifiant SNCU du réseau le plus
            proche identifié par France Chaleur Urbaine.
          </li>
          <li>
            <b>Nb logements (lots) :</b> information provenant de la{' '}
            <a
              href="https://www.data.gouv.fr/fr/datasets/base-de-donnees-nationale-des-batiments/"
              target="_blank"
            >
              Base Nationale Des Bâtiments
            </a>{' '}
            du CSTB ou du{' '}
            <a
              href="https://www.registre-coproprietes.gouv.fr/"
              target="_blank"
            >
              Registre National d'Immatriculation des Copropriétés
            </a>{' '}
            de l'ANAH (lorsque disponible pour l’adresse concernée).
          </li>
          <li>
            <b>Conso gaz (MWh) :</b> information extraite des données locales de
            l’énergie pour l'année 2022 (lorsque disponible pour l’adresse
            concernée).
          </li>
          <li>
            <b>Affecté à :</b> exploitant à qui France Chaleur Urbaine a affecté
            la demande. Lorsque “non affecté” est renseigné dans cette colonne,
            France Chaleur Urbaine a jugé cette demande trop éloignée du réseau.
            La collectivité peut ajouter ou modifier une affectation. Celle-ci
            sera effective lorsque France Chaleur Urbaine l’aura validée
            manuellement.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Quelles informations puis-je modifier/compléter ?',
    content: (
      <>
        <p>
          Vous pouvez si vous le souhaiter modifier ou compléter les données sur
          la distance, le nombre de logements, consommations de gaz à l’adresse
          avec les informations dont vous disposez.
        </p>
        <p>
          Que vous soyez la collectivité ou l’exploitant d’un réseau, vous
          pouvez également utiliser la colonne « commentaire » pour toute note
          interne ou pour tout échange d’information (y compris avec France
          Chaleur Urbaine).
        </p>
        <p>
          Enfin, la colonne « Affecté à » peut également être modifiée lorsque
          l’affectation réalisée par France Chaleur Urbaine n’est pas jugée
          pertinente. Par exemple, une demande située loin du réseau peut être
          visible par la collectivité mais non transmise à l’exploitant (« Non
          affectée »). S’il s’avère que cette demande est malgré tout dans le
          périmètre de concession du réseau, la collectivité peut l’attribuer à
          son exploitant en corrigeant l’information dans la colonne « Affecté
          à ». Cette correction sera effective lorsque France Chaleur Urbaine
          l’aura validée manuellement.
        </p>
      </>
    ),
  },
  {
    title: 'Puis-je exporter les données de mon espace gestionnaire ?',
    content: (
      <p>
        Oui, le bouton « exporter » situé en haut à gauche de la carte génère un
        export en format excel de l’ensemble des informations visibles sur
        l’espace.
      </p>
    ),
  },
  {
    title: 'Puis-je filtrer les demandes visibles dans mon espace ?',
    content: (
      <p>
        Il est possible de filtrer les demandes par nom/adresse mail du
        demandeur, adresse, statut, mode et type de chauffage, ainsi que
        gestionnaire. Pour cela, il suffit d’utiliser les champs et listes
        déroulantes situées en haut de l’espace.
      </p>
    ),
  },
  {
    title:
      'Comment visualiser une demande sur la carte de mon espace gestionnaire ?',
    content: (
      <p>
        Il suffit de cliquer sur la ligne concernée dans le tableau : la demande
        apparaît alors avec un repère rouge sur la carte.
      </p>
    ),
  },
  {
    title:
      'Puis-je faire disparaître la carte, qui réduit la largeur visible du tableau ?',
    content: (
      <p>
        Oui, la carte peut être repliée et dépliée grâce au bouton flèche
        visible à gauche de la carte.
      </p>
    ),
  },
];

const AidePage = () => {
  return (
    <SimplePage title="Aide : France Chaleur Urbaine" mode="authenticated">
      <div className="fr-container fr-mt-4w fr-mb-8w">
        <h1>Bienvenue sur l’espace gestionnaire de France Chaleur Urbaine !</h1>
        <p>
          Vous trouverez ci-dessous les réponses aux questions qui nous sont les
          plus fréquemment posées.
        </p>
        <p>
          Vous ne trouvez pas la réponse à vos interrogations, ou souhaitez nous
          faire part de suggestions pour améliorer cet espace gestionnaire ?
          Nous sommes à votre écoute !
        </p>
        <p>
          Contactez-nous&nbsp;:{' '}
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
            france-chaleur-urbaine@developpement-durable.gouv.fr
          </a>
        </p>

        <div className={fr.cx('fr-accordions-group')}>
          {faqItems.map((item, index) => (
            <Accordion key={index} label={item.title}>
              {item.content}
            </Accordion>
          ))}
        </div>
      </div>
    </SimplePage>
  );
};

export default AidePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userSession = await getSession(context);

  if (!userSession) {
    return {
      redirect: {
        destination: '/connexion',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
