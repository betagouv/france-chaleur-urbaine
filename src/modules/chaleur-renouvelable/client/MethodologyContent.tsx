import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import { businessRules } from '@/modules/app/business-rules';

import { MethodologySolutionsSection } from './MethodologySolutionsSection';

/**
 * Shared methodology copy for the standalone page and the results dialog.
 */
export function MethodologyContent() {
  return (
    <>
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
      <h2>2. Comment fonctionne le simulateur ? 4 questions pour des réponses sur mesure</h2>
      <p>
        Le simulateur vous pose <strong>4 questions simples</strong> pour affiner ses propositions :
      </p>
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
          <strong>Votre type de radiateur</strong> :
          <ul className="fr-my-0">
            <li>à eau</li>
            <li>électriques</li>
            <li>autre</li>
          </ul>
        </li>
        <li>
          <strong>Votre espace extérieur disponible</strong> : balcon ou terrasse / jardin ou cour
        </li>
      </ol>

      <p className="my-3">À partir de ces informations, le simulateur :</p>
      <ul className="mt-0">
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
      <p>
        L’usager peut ensuite affiner ces résultats via l’onglet "Compléter mes paramètres" : mode d'eau chaude sanitaire, classe DPE,
        surface moyenne, habitants par logement, nombre de logements et recalculer les résultats. Le coût du chauffage et de l’installation
        sont alors recalculés.
      </p>
      <hr />
      <h2>3. Quelles données sont utilisées pour personnaliser les résultats ?</h2>
      <p className="my-3">
        À partir de l’adresse du bâtiment, le simulateur interroge automatiquement deux bases de données officielles pour récupérer des
        informations utiles.
      </p>
      <ul className="mt-0">
        <li>
          La première (
          <Link href="https://www.data.gouv.fr/fr/dataservices/api-france-chaleur-urbaine/" isExternal>
            API FCU
          </Link>
          ) détermine l’éligibilité au réseau de chaleur selon la proximité et les périmètres de raccordement. Le simulateur exige aussi une
          distance strictement inférieure à {businessRules.fcrHeatNetworkMaxDistanceMeters.display}.
        </li>
        <li>
          La seconde (
          <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/batenr" isExternal>
            API Bat-ENR
          </Link>
          ) fournit des informations sur les contraintes environnementales de la parcelle : possibilité ou non de faire de la géothermie
          (zone de forage et ressource du sous-sol, BRGM), existence d’un plan de protection de l’atmosphère, présence de contraintes
          patrimoniales ou encore la couverture solaire des toitures (CEREMA)
        </li>
      </ul>
      <p className="my-3">À partir de ces éléments, le simulateur propose les solutions les plus adaptées :</p>
      <ul className="mt-0">
        <li>
          Le raccordement au réseau de chaleur est recommandé si le bâtiment est en chauffage collectif, éligible selon FCU, équipé de
          radiateurs à eau, à moins de {businessRules.fcrHeatNetworkMaxDistanceMeters.display} du réseau et sans refus de raccordement
          identifié,
        </li>
        <li>La géothermie n’est pas recommandée en zone défavorable,</li>
        <li>
          En zone de protection de l'atmosphère, la chaudière à bois reste proposée, mais cette contrainte est signalée dans ses prérequis,
        </li>
        <li>
          Les contraintes patrimoniales sont signalées, si une pompe à chaleur aérothermique, une chaudière bois ou le solaire thermique
          sont envisagés,
        </li>
        <li>Si un réseau de froid est située à moins de 50 m, la solution réseau de chaleur affiche « rafraîchissement possible.</li>
      </ul>
      <hr />
      <MethodologySolutionsSection />
      <Image
        src="/img/demarche_enr_choix.webp"
        caption="Démarche ENR Choix : Hiérarchie des solutions"
        alt="Image représentant l'ENR choix"
        width={1400}
        height={474}
      />
      <h2 className="fr-mt-3w">5. Que vous dit le simulateur pour chaque solution ?</h2>
      <p className="my-3">Pour chaque option compatible, vous obtiendrez :</p>
      <ul className="mt-0">
        <li>
          <strong>Un coût estimé d’installation</strong> (par logement, fourchette non contractuelle).
        </li>
        <li>
          <strong>Une estimation de votre facture annuelle</strong> (le coût annuel inclut l'abonnement, l'énergie, l'entretien courant et
          le gros entretien, hors investissement et hors aides).
        </li>
        <li>
          <strong>Le gain attendu sur votre DPE</strong> (ex. : passage de D à C).
        </li>
        <li>
          <strong>Les avantages et inconvénients</strong> (entretien, espace nécessaire, réglementation…).
        </li>
      </ul>
      <p>
        Quand votre bâtiment est identifié, le simulateur préremplit le DPE, la surface et le nombre de logements à partir des bases
        nationales (BDNB, RNIC). À défaut, il utilise des valeurs par défaut (DPE E, 70 m², 2 personnes, 25 logements). Vous pouvez les
        ajuster pour affiner les résultats.
      </p>
      <p>
        <strong>Coût annuel par logement et gain par rapport au gaz :</strong>
        <br /> <br /> Ils sont calculés avec le moteur du comparateur de coûts et d'émissions de CO₂, réalisé par France Chaleur Urbaine
        avec le concours de l'association AMORCE et du bureau d'études Elcimaï. Le coût annuel additionne l'abonnement, la consommation
        d'énergie, l'entretien courant et le gros entretien, hors investissement et hors aides. Le gain affiché compare ce coût à celui d'un
        chauffage au gaz dans la même situation (ou d'une production d'eau chaude au gaz pour les solutions « eau chaude seulement »). Les
        prix des réseaux de chaleur proviennent de l'enquête FEDENE/AMORCE ; les données économiques des autres modes de chauffage sont
        mises à jour chaque année. Consulter la note méthodologique du comparateur.
      </p>
      <p>
        <strong>Coût d'installation par logement :</strong>
        <br /> <br />
        Les fourchettes proviennent d'une analyse réalisée par le bureau d'études Pouget Consultants sur un ensemble d'installations. Deux
        solutions font exception : pour le réseau de chaleur, le coût de raccordement par logement diminue avec le nombre de logements du
        bâtiment ; pour le solaire thermique, il dépend de la surface de capteurs nécessaire. Ces montants sont indicatifs et ne remplacent
        pas un devis.
      </p>
      <hr />
      <h2>6. Pourquoi ce classement des solutions ?</h2>
      <p className="my-3">
        Le simulateur suit la logique <strong>"ENR choix"</strong>, qui privilégie :
      </p>
      <ul className="mt-0">
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
      <p>
        <strong>Attention</strong> : Le simulateur donne une première estimation, mais la faisabilité technique et économique réelle devra
        être étudiée plus finement avec un professionnel. Certaines solutions peuvent être exclues en raison de contraintes d’intégration
        (visuelle, encombrement, accès, réglementation…).
      </p>
      <hr />
      <h2>7. Et après ? Comment concrétiser votre projet ?</h2>
      <p>
        Le simulateur vous donne une <strong>première estimation</strong>, mais chaque projet est unique. Pour aller plus loin :
      </p>
      <ul>
        <li>
          <strong>Contactez un·e conseiller·ère France Rénov’</strong> pour une étude personnalisée et neutre.
        </li>
        <li>
          <strong>Comparez les devis</strong> de plusieurs professionnels qualifiés RGE.
        </li>
        <li>
          <strong>Vérifiez les aides financières</strong> disponibles (MaPrimeRénov’, CEE, primes locales…).
        </li>
      </ul>
    </>
  );
}
