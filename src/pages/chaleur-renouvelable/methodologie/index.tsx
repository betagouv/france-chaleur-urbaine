import SimplePage from '@/components/shared/page/SimplePage';
import Image from '@/components/ui/Image';

function ChaleurRenouvelableMethodologiePage() {
  return (
    <SimplePage
      title="Simulateur de chauffage écologique et économique : comment ça marche ?"
      currentPage="/chaleur-renouvelable/methodologie"
      description="Simulateur de chauffage écologique et économique : comment ça marche ?"
      layout="center"
      className="fr-my-5w"
    >
      <h1>Simulateur de chauffage écologique et économique : comment ça marche ?</h1>
      <h2>1. Pourquoi un simulateur pour le chauffage écologique ?</h2>
      <p>
        Changer de système de chauffage est un projet complexe :{' '}
        <strong>coût, aides financières, économies réalisables, durée des travaux, confort, réglementation…</strong> Autant de questions qui
        peuvent freiner votre décision. Pourtant, des solutions écologiques (énergies renouvelables, dites “ENR”) existent pour presque tous
        les logements.
      </p>
      <p>
        Aujourd’hui, un accompagnement neutre et gratuit est proposé par les <strong>espaces France Rénov’</strong>, mais beaucoup de
        propriétaires ne savent pas vers qui se tourner en amont. <strong>Ce simulateur se positionne comme une première étape</strong> : il
        vous donne une estimation personnalisée, technique et chiffrée, pour vous aider à vous projeter et à préparer votre projet avant de
        contacter des professionnels.
      </p>
      <p>
        <strong>Objectif</strong> : Vous montrer quelles sont les solutions ENR qui sont compatibles avec votre logement, et vous aider à
        passer à l’action en vous outillant d’informations claires.
      </p>
      <hr />
      <h2>2. Comment fonctionne le simulateur ? 3 questions pour des réponses sur mesure</h2>
      <p>
        Le simulateur vous pose <strong>3 questions simples</strong> pour affiner ses propositions :
        <ol>
          <li>
            <strong>Votre adresse</strong> : Pour connaître les contraintes locales (distance au réseau de chaleur, réglementation, etc.).
          </li>
          <li>
            <strong>Votre type de bâtiment</strong> :
            <ul className="fr-my-0">
              <li>Immeuble à chauffage collectif</li>
              <li>Immeuble à chauffage individuel</li>
              <li>Maison individuelle</li>
            </ul>
          </li>
          <li>
            <strong>Votre espace extérieur disponible</strong> : Jardin, cour, balcon, terrasse…
          </li>
        </ol>
      </p>
      <p>
        À partir de ces informations, le simulateur :
        <ul>
          <li>
            <strong>Exclut les solutions incompatibles</strong> (ex. : pas de pompe à chaleur sans espace extérieur).
          </li>
          <li>
            <strong>Classe les solutions par ordre de pertinence</strong>, en suivant les recommandations de l’ADEME et la logique “ENR
            choix”.
          </li>
          <li>
            <strong>Estime le coût d’installation, les économies réalisables et le gain sur votre DPE</strong>.
          </li>
        </ul>
      </p>
      <hr />
      <h2>3. Quelles données sont utilisées pour personnaliser les résultats ?</h2>
      <p>
        À partir de l’adresse du bâtiment, le simulateur interroge automatiquement deux bases de données officielles pour récupérer des
        informations utiles.
        <ul>
          <li>
            La première (API FCU) permet de savoir si un réseau de chaleur passe à proximité (à moins de 100 mètres), ce qui indique si un
            raccordement est envisageable,
          </li>
          <li>
            La seconde (API Bat-ENR) fournit des informations sur les contraintes environnementales de la parcelle : possibilité ou non de
            faire de la géothermie (zone favorable, intermédiaire ou défavorable), existence d’un plan de protection de l’atmosphère, ou
            encore présence de contraintes patrimoniales.
          </li>
        </ul>
      </p>
      <p>
        À partir de ces éléments, le simulateur propose les solutions les plus adaptées :
        <ul>
          <li>Le raccordement au réseau de chaleur est recommandé s’il est proche et si le bâtiment dispose d’un chauffage collectif,</li>
          <li>La géothermie n’est pas recommandée en zone défavorable,</li>
          <li>La biomasse est écartée en cas de plan de protection de l’atmosphère,</li>
          <li>Et les contraintes patrimoniales sont signalées, notamment si une pompe à chaleur aérothermique est envisagée.</li>
        </ul>
      </p>
      <hr />
      <h2>4. Quelles solutions écologiques sont proposées ?</h2>
      <p>
        Le simulateur ne propose <strong>que des solutions écologiques</strong> (pas de gaz, fioul ou radiateurs électriques). Voici les
        principales options, détaillées et classées selon votre type de logement :
      </p>
      <h3>🏢 Immeuble avec chauffage collectif</h3>
      <p>
        Les solutions sont classées par ordre de pertinence, selon la logique “ENR choix” :
        <ol>
          <li>
            <strong>Réseau de chaleur</strong> (si disponible à moins de 100 m) : chaleur produite à partir de biomasse, géothermie ou
            chaleur fatale (récupération de chaleur industrielle), distribuée via un réseau.
          </li>
          <li>
            <strong>Géothermie</strong> (si le sous-sol est adapté) : exploitation de la chaleur naturelle du sous-sol.
          </li>
          <li>
            <strong>Solaire thermique</strong> utilisation du rayonnement solaire pour produire de la chaleur (eau chaude sanitaire).
          </li>
          <li>
            <strong>Biomasse</strong> (si pas de plan de protection de l’atmosphère) : combustion ou transformation de matières organiques
            (déchets forestiers, agricoles…).
          </li>
          <li>
            <strong>Pompe à chaleur aérothermique</strong> (si espace extérieur disponible) : récupération de la chaleur présente dans l’air
            extérieur.
          </li>
          <li>
            <strong>Solution hybride</strong> (pompe à chaleur air/eau collective et chaudière au gaz)
          </li>
        </ol>
      </p>
      <h3>🏠 Maison individuelle</h3>
      <p>
        Les solutions sont classées par ordre de pertinence :
        <ol>
          <li>
            <strong>Pompe à chaleur eau/eau géothermique</strong> (si le terrain le permet)
          </li>
          <li>
            <strong>Biomasse</strong> (poêle ou chaudière à granulés)
          </li>
          <li>
            <strong>Solaire thermique</strong> (pour l’eau chaude et/ou le chauffage)
          </li>
          <li>
            <strong>Pompe à chaleur air/eau</strong> (si espace extérieur)
          </li>
          <li>
            <strong>Pompe à chaleur air/air</strong> (si espace extérieur)
          </li>
        </ol>
      </p>
      <h3>🏢 Immeuble avec chauffage individuel</h3>
      <ul>
        <li>
          <strong>Pompe à chaleur air/eau</strong> (si espace extérieur)
        </li>
        <li>
          <strong>Pompe à chaleur air/air</strong> (si espace extérieur)
        </li>
      </ul>
      <Image
        src="/img/demarche_enr_choix.webp"
        caption="Démarche ENR Choix : Hiérarchie des solutions"
        alt="Image représentant l'ENR choix"
        width={1400}
        height={474}
      />
      <h2 className="fr-mt-3w">5. Que vous dit le simulateur pour chaque solution ?</h2>
      <p>
        Pour chaque option compatible, vous obtiendrez :
        <ul>
          <li>
            <strong>Un coût estimé d’installation</strong> (par logement, fourchette non contractuelle).
          </li>
          <li>
            <strong>Une estimation de votre facture annuelle</strong> (comparée au gaz, hors abonnement).
          </li>
          <li>
            <strong>Le gain attendu sur votre DPE</strong> (ex. : passage de D à C).
          </li>
          <li>
            <strong>Les avantages et inconvénients</strong> (entretien, espace nécessaire, réglementation…).
          </li>
        </ul>
      </p>
      <p>
        <strong>Les calculs sont basés sur des données par défaut (DPE E, 70 m², 2 personnes par logement)</strong>, mais vous pouvez les
        ajuster pour affiner les résultats.
      </p>
      <hr />
      <h2>6. Pourquoi ce classement des solutions ?</h2>
      <p>
        Le simulateur suit la logique <strong>"ENR choix"</strong>, qui privilégie :
        <ul>
          <li>
            <strong>Les énergies renouvelables les plus durables</strong> (géothermie, solaire, biomasse).
          </li>
          <li>
            <strong>Les solutions collectives</strong> quand c’est possible (réseaux de chaleur, géothermie collective).
          </li>
          <li>
            <strong>Les économies d’échelle</strong> (meilleur rapport coût/efficacité pour les immeubles).
          </li>
          <li>
            <strong>L’adéquation avec les contraintes locales</strong> (réglementation, espace, ressources disponibles).
          </li>
        </ul>
      </p>
      <p>
        <strong>Attention</strong> : Le simulateur donne une première estimation, mais la faisabilité technique et économique réelle devra
        être étudiée plus finement avec un professionnel. Certaines solutions peuvent être exclues en raison de contraintes d’intégration
        (visuelle, encombrement, accès, réglementation…).
      </p>
      <hr />
      <h2>7. Et après ? Comment concrétiser votre projet ?</h2>
      <p>
        Le simulateur vous donne une <strong>première estimation</strong>, mais chaque projet est unique. Pour aller plus loin :
        <ul>
          <li>
            <strong>Contactez un conseiller France Rénov’</strong> pour une étude personnalisée et neutre.
          </li>
          <li>
            <strong>Comparez les devis</strong> de plusieurs professionnels qualifiés RGE.
          </li>
          <li>
            <strong>Vérifiez les aides financières</strong> disponibles (MaPrimeRénov’, CEE, primes locales…).
          </li>
        </ul>
      </p>
    </SimplePage>
  );
}

export default ChaleurRenouvelableMethodologiePage;
