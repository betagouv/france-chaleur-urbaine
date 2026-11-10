import { SolutionContentLink } from '../client/SolutionContentLink';
import { SolutionFaqItem } from '../client/SolutionFaqItem';
import { SolutionFlow } from '../client/SolutionFlow';
import { SolutionFundingCard } from '../client/SolutionFundingCard';
import { SolutionFundingList } from '../client/SolutionFundingList';
import { SolutionListItem } from '../client/SolutionListItem';
import { SolutionResourceCard } from '../client/SolutionResourceCard';
import { SolutionSection } from '../client/SolutionSection';
import { SolutionSteps } from '../client/SolutionSteps';
import { SolutionSummaryCard } from '../client/SolutionSummaryCard';
import { SolutionTestCallout } from '../client/SolutionTestCallout';

/**
 * Presents the validated pac-air-eau-individuelle article.
 */
export function IndividualAirToWaterHeatPumpArticle() {
  return (
    <>
      <SolutionTestCallout />

      <OverviewSection />

      <DefinitionSection />

      <OperationSection />

      <SuitabilitySection />

      <SolutionTestCallout />

      <BenefitsSection />

      <CautionsSection />

      <ProjectStepsSection />

      <FaqSection />

      <CostSection />

      <FundingSection />

      <SolutionTestCallout />

      <ResourcesSection />
    </>
  );
}

/**
 * Renders the article's en-quelques-mots section.
 */
function OverviewSection() {
  return (
    <SolutionSection id="en-quelques-mots">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SolutionSummaryCard tone="building">
          <p>Logements équipés d'un chauffage individuel, notamment au gaz.</p>
          <p>
            Elle remplace une chaudière individuelle et permet d'assurer le chauffage et selon les modèles la production d'eau chaude
            sanitaire.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            De <strong>7 000 à 10 000 €</strong> selon les équipements et les contraintes d'installation (avant déduction des aides)
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>
            Nécessite de disposer d’un emplacement adapté pour les équipements, notamment l’unité extérieure lorsqu’elle est nécessaire. La
            performance thermique du logement, la capacité électrique et les contraintes de la copropriété ou de l’urbanisme doivent
            également être vérifiées.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer une chaudière individuelle gaz ou fioul par une solution renouvelable/bas carbone pour améliorer son DPE, réduire
            les émissions de CO2 et diminuer le recours aux énergies fossiles.
          </p>
        </SolutionSummaryCard>
      </div>
    </SolutionSection>
  );
}

/**
 * Renders the article's de-quoi-sagit-il section.
 */
function DefinitionSection() {
  return (
    <SolutionSection id="de-quoi-sagit-il" photo="/img/icon-pac.webp">
      <p>
        Une pompe à chaleur (PAC) air/eau individuelle utilise les calories présentes dans l’air pour produire de la chaleur et alimenter le
        chauffage d’un logement et, selon les modèles, produire l’eau chaude sanitaire.
      </p>
      <p>Contrairement à une PAC collective, elle est installée à l’échelle d’un seul logement.</p>
      <p>Plusieurs configurations existent :</p>
      <ul>
        <SolutionListItem>avec une unité extérieure</SolutionListItem>
        <SolutionListItem>en version hybride associée à un appoint gaz</SolutionListItem>
        <SolutionListItem>ou sans unité extérieure pour certains systèmes utilisant l’air extrait par la ventilation</SolutionListItem>
      </ul>
      <p>Cette solution est notamment adaptée au remplacement d’une chaudière individuelle gaz ou fioul.</p>
    </SolutionSection>
  );
}

/**
 * Renders the article's fonctionnement section.
 */
function OperationSection() {
  return (
    <SolutionSection id="fonctionnement">
      <p>Une PAC air/eau individuelle est généralement composée de deux principaux éléments :</p>
      <ul>
        <SolutionListItem>
          <strong>Une unité extérieure</strong>, installée par exemple sur un balcon, en façade ou dans le jardin, qui capte les calories
          naturellement présentes dans l’air extérieur.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Une unité intérieure</strong>, installée dans le logement, qui récupère cette énergie, en élève la température grâce à un
          cycle thermodynamique, puis la transmet au circuit d’eau du logement.
        </SolutionListItem>
      </ul>
      <p>La chaleur est ensuite distribuée vers les radiateurs ou le plancher chauffant.</p>
      <p>Selon les modèles, l’installation peut assurer :</p>
      <ul>
        <SolutionListItem>le chauffage du logement</SolutionListItem>
        <SolutionListItem>la production d’eau chaude sanitaire</SolutionListItem>
        <SolutionListItem>le rafraîchissement, avec certains équipements compatibles</SolutionListItem>
      </ul>
      <p>
        Il existe également des configurations sans unité extérieure, qui utilisent l’air extrait par la ventilation du logement comme
        source de chaleur, ainsi que des PAC hybrides, associées à un appoint au gaz.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Air extérieur',
          },
          {
            description: '(capte les calories)',
            label: 'Unité extérieure',
          },
          {
            description: '(augmente la température)',
            label: 'Unité intérieure',
          },
          {
            label: 'Circuit d’eau du logement',
          },
          {
            label: 'Radiateurs\nPlancher chauffant\nEau chaude sanitaire',
          },
        ]}
      />
    </SolutionSection>
  );
}

/**
 * Renders the article's conditions section.
 */
function SuitabilitySection() {
  return (
    <SolutionSection id="conditions">
      <p>
        <strong>Pré-requis :</strong>
      </p>
      <p>
        Avant d'engager le projet, il est recommandé de vérifier que le logement présente un niveau de performance énergétique satisfaisant
        (ou qu'une rénovation de son enveloppe est prévue) afin d'optimiser les performances de la pompe à chaleur.
      </p>
      <p>
        <strong>La PAC air/eau individuelle est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>le logement est équipé d'un chauffage individuel au gaz ou fioul</SolutionListItem>
        <SolutionListItem>un espace suffisant est disponible pour installer les équipements</SolutionListItem>
        <SolutionListItem>
          un emplacement adapté est disponible pour installer l'unité extérieure (lorsque cela est nécessaire)
        </SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's avantages section.
 */
function BenefitsSection() {
  return (
    <SolutionSection id="avantages">
      <ul>
        <SolutionListItem>Utilise une énergie renouvelable disponible partout (l’air extérieur)</SolutionListItem>
        <SolutionListItem>Réduit les émissions de gaz à effet de serre liées au chauffage</SolutionListItem>
        <SolutionListItem>Peut assurer le chauffage et la production d’eau chaude sanitaire avec une seule installation</SolutionListItem>
        <SolutionListItem>
          Certaines configurations peuvent fonctionner sans unité extérieure, en utilisant l’air extrait par la ventilation
        </SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's vigilance section.
 */
function CautionsSection() {
  return (
    <SolutionSection id="vigilance">
      <p>Avant d'engager un projet, vérifier :</p>
      <ul>
        <SolutionListItem>la place disponible dans le logement pour installer les équipements</SolutionListItem>
        <SolutionListItem>la possibilité d’installer une unité extérieure, selon la solution</SolutionListItem>
        <SolutionListItem>les contraintes acoustiques liées au fonctionnement des équipements</SolutionListItem>
        <SolutionListItem>le niveau d’isolation du logement</SolutionListItem>
        <SolutionListItem>la capacité de l’installation électrique à alimenter les équipements</SolutionListItem>
        <SolutionListItem>les éventuelles contraintes architecturales ou patrimoniales</SolutionListItem>
        <SolutionListItem>les autorisations nécessaires auprès de la copropriété ou l’urbanisme</SolutionListItem>
        <SolutionListItem>
          le dimensionnement des infrastructures électriques (dans le cas où plusieurs logements sont équipés d’une PAC dans un même
          bâtiment)
        </SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's etapes section.
 */
function ProjectStepsSection() {
  return (
    <SolutionSection id="etapes">
      <SolutionSteps
        steps={[
          { title: 'Étude de faisabilité du logement et des équipements existants / devis de l’installateur' },
          { title: 'Choix et dimensionnement de la solution' },
          { title: 'Vérification des autorisations nécessaires auprès de la copropriété' },
          { title: 'Recherche des financements mobilisables' },
          { title: 'Installation et mise en service' },
          { title: 'Exploitation et maintenance' },
        ]}
      />
      <p>
        Il est fortement conseillé de mettre en place un suivi des consommations énergétiques afin de vérifier les performances de
        l’installation dans le temps.
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's questions section.
 */
function FaqSection() {
  return (
    <SolutionSection id="questions">
      <SolutionFaqItem question={"Une pompe à chaleur fonctionne-t-elle lorsqu'il fait froid ?"}>
        <p>
          Oui. Elle continue de fonctionner en hiver, mais ses performances diminuent progressivement lorsque la température extérieure
          baisse. Son dimensionnement est donc une étape essentielle.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={"Peut-elle produire l'eau chaude sanitaire ?"}>
        <p>Oui. Selon la configuration retenue, elle peut assurer à la fois le chauffage et la production d'eau chaude sanitaire.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il obligatoirement installer une unité extérieure ?'}>
        <p>Non. Certaines solutions utilisent l'air extrait par la ventilation du logement et fonctionnent sans unité extérieure.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une pompe à chaleur est-elle bruyante ?'}>
        <p>
          Les unités extérieures produisent un niveau sonore à prendre en compte dès la conception du projet. Leur implantation doit être
          étudiée afin de limiter les nuisances pour les occupants et le voisinage.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Tous les logements peuvent-ils installer une pompe à chaleur individuelle ?'}>
        <p>
          Non. La faisabilité dépend de la configuration du logement, du niveau d'isolation, de l'espace disponible et des contraintes
          techniques ou réglementaires.
        </p>
      </SolutionFaqItem>
    </SolutionSection>
  );
}

/**
 * Renders the article's cout section.
 */
function CostSection() {
  return (
    <SolutionSection id="cout">
      <p>
        Le coût dépend des besoins en chauffage et en eau chaude sanitaire, des équipements existants, de la configuration du logement et
        des éventuels travaux.
      </p>
      <p>
        Il est généralement compris entre <strong>7 000 et 10 000 € par logement</strong>, avant déduction des aides financières.
      </p>
      <p>Une étude de faisabilité est indispensable pour obtenir un chiffrage précis et dimensionner correctement l'installation.</p>
      <p>
        Pour en savoir plus sur l’estimation budgétaire, utilisez le simulateur réalisé par <strong>France Chaleur Urbaine</strong>
      </p>
      <p>
        <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable">
          Tester le simulateur
        </SolutionContentLink>
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's aides section.
 */
function FundingSection() {
  return (
    <SolutionSection id="aides">
      <p>L’installation peut bénéficier de plusieurs dispositifs d’aide, sous réserve de respecter les critères d’éligibilité.</p>
      <p>Selon les projets, il est possible de mobiliser :</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="renovation">
          MaPrimeRénov’ : éligible, sous conditions de ressources et de respect des critères techniques.
        </SolutionFundingCard>
        <SolutionFundingCard kind="cee">les Certificats d’économies d’énergie (CEE)</SolutionFundingCard>
        <SolutionFundingCard kind="local">dans certains cas des aides locales</SolutionFundingCard>
      </SolutionFundingList>
      <p>
        Pour en savoir plus sur les aides mobilisables, utilisez le simulateur réalisé par <strong>France Chaleur Urbaine :</strong>
      </p>
      <p>
        <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable">
          Tester le simulateur
        </SolutionContentLink>
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's aller-plus-loin section.
 */
function ResourcesSection() {
  return (
    <SolutionSection id="aller-plus-loin">
      <SolutionResourceCard
        title="Tester cette solution et préparer votre projet"
        icon="🧮"
        actionHref="/chaleur-renouvelable"
        actionLabel="Tester le simulateur"
        isPrimary
      >
        <p>
          Le simulateur réalisé par <strong>France Chaleur Urbaine</strong> vous permet d'évaluer la pertinence d'une PAC air/eau
          individuelle pour votre logement.
        </p>
        <p>Vous y trouverez :</p>
        <ul>
          <SolutionListItem>une estimation des coûts de consommation et du prix de l’installation</SolutionListItem>
          <SolutionListItem>
            une mise en lien avec un conseiller du service public capable de vous accompagner dans votre projet
          </SolutionListItem>
        </ul>
      </SolutionResourceCard>
      <SolutionResourceCard title="En savoir plus sur les pompes à chaleur" icon="📚">
        <p>
          Consultez les ressources de l’<strong>ADEME</strong> pour mieux comprendre le fonctionnement et les performances des pompes à
          chaleur et vous aider à préparer votre projet.
        </p>
        <p>
          <SolutionContentLink href="https://librairie.ademe.fr/batiment/8595-etude-sur-les-consommations-des-pac-air-air.html#">
            https://librairie.ademe.fr/batiment/8595-etude-sur-les-consommations-des-pac-air-air.html#
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://www.ademe.fr/presse/communique-national/les-pompes-a-chaleur-une-solution-a-fort-potentiel/">
            https://www.ademe.fr/presse/communique-national/les-pompes-a-chaleur-une-solution-a-fort-potentiel/
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://www.geothermies.fr/usages-production">
            https://www.geothermies.fr/usages-production
          </SolutionContentLink>
          <SolutionContentLink href="https://librairie.ademe.fr/batiment/7749-comment-choisir-sa-pompe-a-chaleur--9791029725517.html">
            https://librairie.ademe.fr/batiment/7749-comment-choisir-sa-pompe-a-chaleur--9791029725517.html
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
