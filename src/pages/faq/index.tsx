import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Accordion from '@/components/ui/Accordion';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { slugify } from '@/utils/strings';

const FAQ_ACCORDION_SCROLL_DELAY_MS = 300;

type FaqItem = {
  answer: ReactNode;
  question: string;
};

type FaqCategory = {
  category: string;
  questions: FaqItem[];
};

const FAQS: FaqCategory[] = [
  {
    category: '🔌 Raccordement à un réseau de chaleur',
    questions: [
      {
        answer: (
          <>
            <p>
              Pour connaître les possibilités de raccordement à un réseau de chaleur, nous vous invitons à formuler votre demande via{' '}
              <Link href="/">le test d’éligibilité</Link> situé sur la page d'accueil de <Link href="/">France Chaleur Urbaine</Link>.
            </p>
            <p>
              Une fois l'adresse testée, vous accédez à un formulaire à compléter qui sera transmis au gestionnaire du réseau le plus
              proche. Celui-ci est alors en charge de vous recontacter afin de vérifier les informations nécessaires pour s'assurer de la
              faisabilité du raccordement, répondre à vos questions, et vous fournir, le cas échéant, une estimation du coût de raccordement
              et du coût de l'énergie.
            </p>
            <p>Cette demande d’estimation est gratuite et ne vous engage en rien.</p>
          </>
        ),
        question: 'Comment savoir si mon bâtiment est raccordable à un réseau ?',
      },
      {
        answer: (
          <>
            <p>
              France Chaleur Urbaine est un service public numérique porté par l’ADEME qui promeut le chauffage urbain en facilitant la mise
              en relation entre copropriétés, gestionnaires de bâtiments et opérateurs de réseaux de chaleur. En tant que tiers de
              confiance, notre rôle consiste à accompagner les usagers intéressés par un raccordement et à faciliter la prise de contact
              avec le gestionnaire du réseau.
            </p>
            <p>
              La délivrance d’une attestation de non-raccordement ne relève pas du service France Chaleur Urbaine : seul le gestionnaire du
              réseau de chaleur est habilité à fournir ce document.
              <br />
              Si vous êtes déjà en contact avec le gestionnaire concerné, vous pouvez lui adresser directement votre demande lorsqu’il
              reviendra vers vous.
            </p>
            <p>
              <Link
                href="https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage-batiments-residentiels-collectifs-tertiaires"
                isExternal
              >
                Plus d’informations sont disponibles ici
              </Link>
              .
            </p>
          </>
        ),
        question: 'France Chaleur Urbaine peut-elle fournir une attestation de non-raccordement ?',
      },
      {
        answer: (
          <>
            <p>Si votre bâtiment ne peut pas être raccordé, vous pouvez vous tourner vers d’autres solutions de chauffage écologiques.</p>
            <p>
              Le simulateur France Chaleur Urbaine (ADEME) analyse votre bâtiment et propose les alternatives adaptées : pompe à chaleur,
              géothermie, solaire thermique, biomasse, ou réseau de chaleur si une extension devient possible.
            </p>
            <p>
              <Link href="/chaleur-renouvelable">
                Testez votre adresse pour obtenir des recommandations adaptées à votre bâtiment :
                france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable
              </Link>
            </p>
          </>
        ),
        question: 'Que faire si mon immeuble n’est pas éligible au réseau de chaleur ?',
      },
      {
        answer: (
          <>
            <p className="fr-mb-0">
              Si vous rencontrez un problème (facturation, qualité de service, fonctionnement du réseau…), nous vous invitons à contacter
              directement :
            </p>
            <ul>
              <li>le gestionnaire du réseau, qui est votre interlocuteur principal pour tout sujet technique ou contractuel ;</li>
              <li>
                ou la collectivité propriétaire du réseau, si vous souhaitez signaler une difficulté ou obtenir un suivi complémentaire.
              </li>
            </ul>
          </>
        ),
        question: 'Que faire si je rencontre un problème avec mon réseau de chaleur ?',
      },
    ],
  },
  {
    category: '🗺️ Fonctionnement de la carte France Chaleur Urbaine',
    questions: [
      {
        answer: (
          <>
            <p className="fr-mb-0">
              La carte France Chaleur Urbaine rassemble en un même outil l’ensemble des informations utiles pour comprendre les réseaux de
              chaleur et de froid, identifier les potentiels de développement et analyser les ressources énergétiques mobilisables. Elle se
              compose de quatre onglets :
            </p>
            <ul className="space-y-3">
              <li>
                <strong>Réseaux</strong>
                <br />
                Cet onglet présente l’état actuel des réseaux : réseaux existants (classés ou non classés), périmètres de développement
                prioritaires, réseaux en construction, réseaux de froid ainsi que les bâtiments déjà raccordés.
              </li>
              <li>
                <strong>Potentiel</strong>
                <br />
                Il permet d’explorer les opportunités de développement notamment : les demandes de raccordement déposées sur la plateforme,
                les données énergétiques à l’échelle du bâtiment (consommations, types de chauffage) issus du SDES et de la BDNB, les
                besoins en chaleur et en froid des bâtiments ou encore les potentiels territoriaux pour la création de réseaux (données du
                CEREMEA dans le cadre du Projet EnRézo), les quartiers prioritaires politiques de la ville engagés dans le nouveau programme
                national de renouvellement urbain porté par l’ANRU.
              </li>
              <li>
                <strong>ENR&R</strong>
                <br />
                Cet onglet recense les ressources énergétiques mobilisables : chaleur fatale (incinération, industrie, stations
                d’épuration…), potentiels en géothermie profonde, zones favorables au solaire thermique et installations existantes de
                géothermie.
              </li>
              <li>
                <strong>Outils</strong>
                <br />
                Il met à disposition des fonctionnalités pratiques : mesure de distances, extraction de données sur les bâtiments d’une zone
                et calcul de densités thermiques linéaires.
              </li>
            </ul>
            <p>
              Ces onglets peuvent être activés ou combinés pour analyser un territoire, identifier des opportunités de raccordement ou
              préparer un projet de réseau.
            </p>
            <p>
              👉{' '}
              <Link href="/donnees" className="font-bold">
                Plus d’informations sur les données et sources utilisées
              </Link>
            </p>
          </>
        ),
        question: 'Que contiennent les différents onglets de la carte des réseaux ?',
      },
      {
        answer: (
          <>
            <p>
              La cartographie s’appuie sur plusieurs sources nationales de référence et des contributions locales permettant de représenter
              au mieux l’état des réseaux de chaleur et de froid.
            </p>
            <p>
              Chaque jeu de données indique sa source, sa date de mise à jour et sa période de validité. Malgré ces précautions, des écarts
              peuvent apparaître lors de travaux récents ou de modifications non encore signalées. Si vous constatez une incohérence, vous
              pouvez nous en informer via <Link href="/contribution">le formulaire de contribution</Link> : vos retours contribuent à
              améliorer la qualité des informations.
            </p>
            <p>
              👉{' '}
              <Link href="/donnees" className="font-bold">
                Plus d’informations sur les données et sources utilisées
              </Link>
            </p>
          </>
        ),
        question: 'D’où proviennent les données affichées sur la carte ?',
      },
      {
        answer: (
          <>
            <p className="mb-0">Plusieurs situations peuvent expliquer l’absence d’un réseau sur la carte :</p>
            <ul className="space-y-3">
              <li>
                <strong>Le tracé du réseau n’a pas encore été transmis à France Chaleur Urbaine.</strong>
                <br />
                Il peut être ajouté ou mis à jour via le <Link href="/contribution">formulaire de contribution</Link>.
              </li>
              <li>
                <strong>Le réseau est en cours de création ou d’extension.</strong>
                <br />
                Dans ce cas, l’affichage interviendra dès réception du tracé prévisionnel.
              </li>
            </ul>
          </>
        ),
        question: 'Pourquoi mon réseau n’apparaît-il pas sur la carte ?',
      },
      {
        answer: (
          <p>
            Saisissez votre adresse dans la barre de recherche en <Link href="/">page d’accueil</Link> : la carte vous indiquera
            automatiquement si un réseau existe à proximité.
          </p>
        ),
        question: 'Comment savoir si mon logement est proche d’un réseau ?',
      },
      {
        answer: (
          <>
            <p>
              Les gestionnaires de parc (bailleurs sociaux, gestionnaires tertiaires, bureaux d’études…) peuvent tester en masse des
              centaines ou milliers d’adresses grâce à la fonctionnalité dédiée. Il suffit de cliquer sur « Tester une liste d’adresses »
              sous la barre de recherche, ou d’y accéder directement depuis la page d’accueil.
            </p>
            <p className="mb-0">Le test en masse permet :</p>
            <ul>
              <li>d’obtenir instantanément un récapitulatif synthétique (proximité d’un réseau, taux d’ENRR, etc.) ;</li>
              <li>d’exploiter les résultats grâce à des filtres ;</li>
              <li>de visualiser sur la carte les adresses raccordables ou non ;</li>
              <li>et, pour chaque adresse, de demander une mise en relation avec le gestionnaire du réseau.</li>
            </ul>
            <p>
              Cette fonctionnalité est accessible en créant un compte professionnel via le bouton « Connectez‑vous ici » en haut à droite.
            </p>
            <p>
              👉{' '}
              <Link className="font-bold" href="/pro/tests-adresses">
                Accéder au test en masse
              </Link>
            </p>
          </>
        ),
        question: 'Comment tester un grand nombre d’adresses sur France Chaleur Urbaine ?',
      },
      {
        answer: (
          <>
            <p>
              France Chaleur Urbaine propose l’outil <strong>« Réseaux d’avenir »</strong>, conçu spécialement pour les élus et les
              collectivités souhaitant évaluer rapidement le potentiel de création d’un réseau de chaleur sur leur territoire.
            </p>
            <p className="mb-0">Cet outil simple et pédagogique permet de :</p>
            <ul>
              <li>renseigner le nom d’une commune ;</li>
              <li>visualiser les opportunités de création de réseaux de chaleur ;</li>
              <li>
                identifier les principaux bâtiments susceptibles d’être raccordés, sur la base des modélisations réalisées par le Cerema
                dans le cadre du projet EnRezo.
              </li>
            </ul>
            <p>Les élus peuvent également laisser leur adresse mail pour être recontactés et accompagnés. </p>
            <p>
              👉{' '}
              <Link className="font-bold" href="/collectivites-et-exploitants/potentiel-creation-reseau">
                Tester le potentiel de votre territoire
              </Link>
            </p>
          </>
        ),
        question: 'Comment identifier le potentiel de création d’un réseau de chaleur sur mon territoire ?',
      },
    ],
  },
  {
    category: '🗂️ Données et mise à jour',
    questions: [
      {
        answer: (
          <>
            <p>
              La carte est mise à jour régulièrement, à partir de données annuelles (Bibliothèque FEDENE, SDES, Arrêté DPE) et
              d’informations transmises ponctuellement par les gestionnaires de réseaux et les collectivités.
            </p>
            <p>
              Chaque jeu de données indique sa date de mise à jour et sa période de validité. Des écarts peuvent toutefois exister lors de
              travaux ou de modifications récentes.
            </p>
            <p>
              Si vous constatez une incohérence, vous pouvez nous contacter via <Link href="/contact">le formulaire de contact.</Link> vos
              retours nous aident à améliorer la qualité des informations.
            </p>
            <p>
              👉{' '}
              <Link href="/donnees" className="font-bold">
                Plus d’informations sur les données et sources utilisées
              </Link>
            </p>
          </>
        ),
        question: 'À quelle fréquence la carte est-elle mise à jour ?',
      },
      {
        answer: (
          <>
            <p>
              Les gestionnaires, maîtres d’ouvrage ou toute structure disposant d’informations fiables sur un réseau de chaleur peut
              transmettre un tracé ou une mise à jour via <Link href="/contribution">le formulaire dédié</Link>.
            </p>
            <p>France Chaleur Urbaine intègre ensuite les informations lors de la prochaine mise à jour de la carte.</p>
          </>
        ),
        question: 'Comment transmettre une mise à jour de mon réseau ?',
      },
      {
        answer: (
          <>
            <p>
              Si vous souhaitez faire ajouter un tracé de réseau en service ou en construction, un périmètre de développement prioritaire
              (PDP) un schéma directeur, ou d’autres informations sur la carte des réseaux de chaleur et de froid, vous pouvez nous
              transmettre les éléments via <strong>le formulaire de contribution dédié</strong> :{' '}
              <Link href="/contribution">https://france-chaleur-urbaine.beta.gouv.fr/contribution</Link>
            </p>
            <p>
              Formats préférentiels : geojson, shapefile, KML, ou GeoPackage. En PDF en dernier recours ou si les premiers formats ne sont
              pas disponibles.
            </p>
            <p>Nos équipes analyseront votre envoi et intégreront les données lors d’une prochaine mise à jour de la plateforme.</p>
          </>
        ),
        question: 'Comment ajouter des données sur la carte (tracé, PDP, schéma directeur, …) ?',
      },
      {
        answer: (
          <>
            <p>
              Le Périmètre de Développement Prioritaire (PDP) est une zone définie autour d’un réseau de chaleur classé où certains
              bâtiments ont l’obligation de se raccorder.
            </p>
            <p>
              Cette obligation concerne notamment les bâtiments neufs et ceux qui renouvellent leur installation de chauffage au‑delà de 30
              kW (seuil ajustable par la collectivité).
            </p>
            <p>
              Un réseau classé en année N doit disposer d’un PDP avant le 1er juillet de l’année N+1. La collectivité élabore ce périmètre
              en partenariat avec le gestionnaire du réseau et les services d’urbanisme.
            </p>
            <p>
              En l’absence de PDP, c’est le périmètre de concession (ou, s’il n’existe pas, le périmètre communal desservi) qui s’applique.
            </p>
            <p>
              La collectivité peut s’opposer au classement par délibération motivée, et les bâtiments concernés peuvent demander une
              dérogation.
            </p>
          </>
        ),
        question: 'Qu’est‑ce qu’un Périmètre de Développement Prioritaire (PDP) et quand/comment le définir ?',
      },
    ],
  },
  {
    category: '🏷️ Classement des réseaux',
    questions: [
      {
        answer: (
          <>
            <p>
              Le classement officiel des réseaux de chaleur et de froid est défini par arrêté. Seuls les réseaux répondant aux critères
              réglementaires (notamment la part d’énergies renouvelables et de récupération) peuvent être identifiés comme “classé”, ainsi
              que ceux ayant délibéré pour classer leur réseau par anticipation.
            </p>
            <p>
              La liste des réseaux classés par arrêté, et déclassés par délibération des collectivités compétences est accessible depuis le
              site du Ministère de la Transition Ecologique :{' '}
              <Link href="https://www.ecologie.gouv.fr/politiques-publiques/reseaux-chaleur" isExternal>
                https://www.ecologie.gouv.fr/politiques-publiques/reseaux-chaleur
              </Link>
              .
            </p>
          </>
        ),
        question: 'Pourquoi certains réseaux sont identifiés comme réseaux classés et d’autres non ?',
      },
      {
        answer: (
          <p>
            Oui, l’arrêté concerne les réseaux de chaleur et de froid. Toutefois, à ce jour, aucun réseau de froid n’a été classé, ce qui
            explique leur absence sur la plateforme France Chaleur Urbaine
          </p>
        ),
        question: 'Les réseaux de froid peuvent-ils être identifiés comme réseaux classés ?',
      },
      {
        answer: (
          <p>
            Être dans un <strong>périmètre de développement prioritaire</strong> signifie que les bâtiments situés dans cette zone sont
            encouragés à se raccorder au réseau lorsqu’ils réalisent des travaux de rénovation énergétique importants ou remplacent leur
            système de chauffage ou de refroidissement au‑delà de 30 kW (seuil ajustable par la collectivité). Cela n’impose pas un
            raccordement automatique, mais crée une obligation d’étude et une priorité donnée à cette solution lorsque cela est
            techniquement et économiquement pertinent.
          </p>
        ),
        question:
          'Qu’est-ce que cela implique pour un bâtiment d’être situé dans une zone autour d’un réseau de chaleur classé (ou Zone de Périmètre de Développement Prioritaire) ?',
      },
    ],
  },
  {
    category: '👤 Espace gestionnaire',
    questions: [
      {
        answer: (
          <>
            <p>
              L’accès à l’espace gestionnaire est créé sur demande, pour les maîtres d’ouvrage, propriétaires de réseau ou exploitants, en
              fonction des besoins liés aux demandes de raccordement reçues sur la plateforme.
            </p>
            <p>
              Une fois vos identifiants activés, vous pouvez consulter, trier et traiter les demandes, répondre directement aux usagers par
              mail, et fournir si nécessaire une estimation de faisabilité, du coût de raccordement et du coût de l’énergie.
            </p>
            <p>
              Nous organisons régulièrement des webinaires de présentation à destination des gestionnaires et propriétaires de réseaux. Vous
              pouvez nous solliciter via <Link href="/contact">le formulaire de contact</Link> pour connaître les prochaines dates et vous
              inscrire.
            </p>
          </>
        ),
        question: 'Comment accéder à mon espace gestionnaire ?',
      },
      {
        answer: (
          <>
            <p className="mb-0">Si vous ne parvenez pas à vous connecter, plusieurs vérifications peuvent vous aider :</p>
            <ul>
              <li>Assurez‑vous d’utiliser l’adresse mail avec laquelle votre accès a été créé.</li>
              <li>Vérifiez que votre mot de passe est correct ou demandez une réinitialisation si nécessaire.</li>
              <li>
                Pensez à vérifier vos spams : certains clients de messagerie peuvent être blacklistés, ce qui empêche la réception des mails
                d’activation ou de réinitialisation.
              </li>
              <li>
                Si le problème persiste (message d’erreur, accès inactif, identifiants non reconnus), contactez‑nous via{' '}
                <Link href="/contact">le formulaire de contact.</Link> Nous vérifierons votre compte et réactiverons vos accès si besoin.
              </li>
            </ul>
          </>
        ),
        question: 'Que faire si je n’arrive pas à me connecter à mon espace gestionnaire ?',
      },
    ],
  },
  {
    category: '📣 Communiquer sur les réseaux de chaleur',
    questions: [
      {
        answer: (
          <>
            <p className="mb-0">
              France Chaleur Urbaine met à disposition une <strong>iframe personnalisable</strong> permettant d’intégrer directement sur
              votre site :
            </p>
            <ul>
              <li>la carte de votre réseau,</li>
              <li>le test d’adresse,</li>
              <li>et les informations associées.</li>
            </ul>
            <p>
              Vous pouvez paramétrer quelques options puis récupérer un code à copier‑coller dans votre site. L’intégration est simple et ne
              nécessite pas d’accompagnement technique particulier.
            </p>

            <p>Près de 70 collectivités et gestionnaires utilisent déjà cette solution.</p>

            <p className="mb-0">L’iframe présente un double avantage :</p>
            <ul>
              <li>offrir une information fiable et à jour sans multiplier les cartes locales,</li>
              <li>répondre aux attentes des usagers, qui consultent souvent en priorité le site de la collectivité.</li>
            </ul>
            <p>
              👉{' '}
              <Link className="font-bold" href="/collectivites-et-exploitants#iframe-carte">
                En savoir plus sur l'iframe
              </Link>
            </p>
          </>
        ),
        question: 'Comment intégrer la carte et le test d’adresse sur mon site internet ?',
      },
      {
        answer: (
          <>
            <p>
              Le site France Chaleur Urbaine met à disposition de nombreux supports pédagogiques téléchargeables : infographies, fiches
              explicatives, schémas, articles et vidéos. Ils peuvent être utilisés lors de réunions publiques, de présentations de projets
              ou pour alimenter vos supports de communication.
            </p>
            <p className="mb-0">Ces documents permettent notamment d’expliquer :</p>
            <ul>
              <li>ce qu’est un réseau de chaleur,</li>
              <li>les différentes énergies utilisées,</li>
              <li>les idées reçues fréquentes (par exemple sur la biomasse ou la déforestation),</li>
              <li>les bénéfices environnementaux et économiques.</li>
            </ul>
            <p>Ces supports ont été conçus pour faciliter vos actions de communication et sont librement réutilisables.</p>
            <p>
              👉{' '}
              <Link className="font-bold" href="/ressources/supports">
                Découvrez nos supports
              </Link>
            </p>
          </>
        ),
        question: 'Quels supports pédagogiques sont disponibles pour présenter un réseau de chaleur ?',
      },
    ],
  },
];

function FaqPage() {
  const router = useRouter();
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');

    if (!hash) {
      return;
    }

    trackPostHogEvent('faq:accordeon', { question: hash });

    setExpandedQuestionId(hash);
    const timeoutId = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({
        block: 'start',
      });
    }, FAQ_ACCORDION_SCROLL_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router.asPath]);

  const updateHash = (questionId: string | null) => {
    const nextUrl = questionId ? `${router.pathname}#${questionId}` : router.pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  return (
    <SimplePage
      title="FAQ : Découvrez le chauffage qui vous convient !"
      currentPage="/faq"
      description="Vos questions sur les réseaux de chaleur et France Chaleur Urbaine"
      layout="center"
    >
      <h1 className="fr-h2 fr-mt-3w">Vos questions sur les réseaux de chaleur et France Chaleur Urbaine</h1>
      <p>
        Vous vous demandez si votre bâtiment est raccordable à un réseau de chaleur, combien coûte un raccordement, qui contacter pour
        avancer sur votre projet, ou encore quelles alternatives existent quand aucun réseau ne passe près de chez vous ?
      </p>
      <p>
        Cette page rassemble les réponses aux questions que l'on nous pose le plus souvent. Elle est organisée par thème : parcourez les
        sections ci-dessous et dépliez les questions qui vous concernent.
      </p>
      <p>
        <strong>Vous ne trouvez pas votre réponse ?</strong> Un encart en bas de page vous permet de contacter directement notre équipe.
      </p>
      <div className="fr-grid-row fr-grid-row--gutters">
        {FAQS.map((faqCategory) => (
          <section key={faqCategory.category} className="fr-col-12 fr-mb-3w">
            <h2 className="fr-h4">{faqCategory.category}</h2>
            <div className="fr-accordions-group">
              {faqCategory.questions.map((faq, index) => {
                const questionId = slugify(faq.question) ?? `faq-question-${index}`;

                return (
                  <div id={questionId} key={faq.question}>
                    <Accordion
                      id={`${questionId}-accordion`}
                      label={faq.question}
                      classes={{
                        collapse: expandedQuestionId === questionId ? 'fr-collapse--expanded' : undefined,
                      }}
                      expanded={expandedQuestionId === questionId}
                      onExpandedChange={(expanded) => {
                        const nextQuestionId = expanded ? questionId : null;
                        if (nextQuestionId) trackPostHogEvent('faq:accordeon', { question: nextQuestionId });
                        setExpandedQuestionId(nextQuestionId);
                        updateHash(nextQuestionId);
                      }}
                    >
                      <div>{faq.answer}</div>
                    </Accordion>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <CallOut>
        <h3>Cette page n'a pas répondu à votre question ?</h3>
        <p>Notre équipe est à votre écoute. Décrivez-nous votre situation et nous reviendrons vers vous.</p>
        <Link href="/contact" variant="secondary" postHogEventKey="faq:cta_contact_equipe">
          Contacter l'équipe France Chaleur Urbaine
        </Link>
      </CallOut>
    </SimplePage>
  );
}

export default FaqPage;
